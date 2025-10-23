# mcp_server.py
"""
Lightweight MCP-style server (Model Context Protocol inspired)
- JSON-RPC 2.0-like messages over WebSocket
- HTTP discovery endpoint for metadata
- Tool registration system
- Two example tools: filesystem and calc
- Async, extensible

Notes:
- This is educational and intentionally small. For production, add TLS, auth, rate-limiting, fine-grained ACLs, and proper sandboxing for code execution.
"""

import asyncio
import json
import logging
import os
import pathlib
import shlex
import traceback
from dataclasses import dataclass, asdict
from typing import Any, Awaitable, Callable, Dict, Optional

import websockets
from websockets.server import WebSocketServerProtocol
from aiohttp import web

# ---- Logging ----
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp_server")

# ---- Types ----
JSON = Dict[str, Any]
RPCHandler = Callable[[JSON], Awaitable[JSON]]

# ---- Utility helpers ----
def json_dumps(payload: JSON) -> str:
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)

def make_error(id_, code: int, message: str, data: Optional[Any] = None) -> JSON:
    err = {"jsonrpc": "2.0", "id": id_, "error": {"code": code, "message": message}}
    if data is not None:
        err["error"]["data"] = data
    return err

def make_result(id_, result: Any) -> JSON:
    return {"jsonrpc": "2.0", "id": id_, "result": result}

# ---- MCP-ish server components ----

@dataclass
class ToolMeta:
    id: str
    title: str
    description: str
    input_schema: Optional[JSON] = None
    output_schema: Optional[JSON] = None

class Tool:
    def __init__(self, meta: ToolMeta):
        self.meta = meta

    async def call(self, params: JSON) -> JSON:
        """
        Override this method in subclasses.
        Should return a JSON-serializable dict
        """
        raise NotImplementedError

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Tool] = {}

    def register(self, tool: Tool):
        if tool.meta.id in self._tools:
            raise KeyError(f"Tool {tool.meta.id} already registered")
        self._tools[tool.meta.id] = tool
        logger.info("Registered tool: %s", tool.meta.id)

    def get(self, tool_id: str) -> Optional[Tool]:
        return self._tools.get(tool_id)

    def list_tools(self):
        return [asdict(t.meta) for t in self._tools.values()]

# ---- Example tool: Filesystem reader ----
class FileSystemTool(Tool):
    def __init__(self, base_path: str = "."):
        meta = ToolMeta(
            id="filesystem",
            title="Filesystem Access",
            description="List directories and read files (safe, relative to base_path).",
            input_schema={
                "type": "object",
                "properties": {
                    "action": {"type": "string", "enum": ["list", "read"]},
                    "path": {"type": "string"},
                    "offset": {"type": "integer"},
                    "length": {"type": "integer"},
                },
                "required": ["action", "path"],
            },
            output_schema=None,
        )
        super().__init__(meta)
        self.base = pathlib.Path(base_path).resolve()

    def _resolve(self, relative_path: str) -> pathlib.Path:
        # Avoid path traversal by resolving and ensuring it's within base
        candidate = (self.base / relative_path).resolve()
        if self.base not in candidate.parents and candidate != self.base:
            raise PermissionError("path outside of allowed base")
        return candidate

    async def call(self, params: JSON) -> JSON:
        action = params.get("action")
        rel_path = params.get("path", ".")
        try:
            target = self._resolve(rel_path)
        except Exception as e:
            return {"ok": False, "error": str(e)}

        if action == "list":
            if not target.exists():
                return {"ok": False, "error": "not found"}
            if not target.is_dir():
                return {"ok": False, "error": "not a directory"}
            entries = []
            for p in sorted(target.iterdir()):
                entries.append({
                    "name": p.name,
                    "is_dir": p.is_dir(),
                    "size": p.stat().st_size,
                })
            return {"ok": True, "entries": entries}
        elif action == "read":
            if not target.exists() or not target.is_file():
                return {"ok": False, "error": "file not found"}
            offset = int(params.get("offset", 0))
            length = params.get("length")
            length = int(length) if length is not None else None
            # Read safely in async-friendly way
            loop = asyncio.get_running_loop()
            def read_sync():
                with target.open("rb") as fh:
                    fh.seek(offset)
                    return fh.read(length)
            content = await loop.run_in_executor(None, read_sync)
            # Return base64 to be safe for binary
            import base64
            return {"ok": True, "content_b64": base64.b64encode(content).decode("ascii")}
        else:
            return {"ok": False, "error": "unknown action"}

# ---- Example tool: Safe calculator ----
import ast
import operator as op

# safe eval using ast to only allow arithmetic
SAFE_OPERATORS = {
    ast.Add: op.add,
    ast.Sub: op.sub,
    ast.Mult: op.mul,
    ast.Div: op.truediv,
    ast.Pow: op.pow,
    ast.USub: op.neg,
    ast.Mod: op.mod,
    ast.FloorDiv: op.floordiv,
}

def safe_eval_expr(expr: str) -> float:
    """
    Evaluate a math expression safely (supports + - * / ** % // and parentheses).
    """
    def _eval(node):
        if isinstance(node, ast.Num):  # type: ignore[attr-defined]
            return node.n
        if isinstance(node, ast.Constant):  # py3.8+
            if isinstance(node.value, (int, float)):
                return node.value
            raise ValueError("Unsupported constant")
        if isinstance(node, ast.BinOp):
            left = _eval(node.left)
            right = _eval(node.right)
            op_type = type(node.op)
            if op_type not in SAFE_OPERATORS:
                raise ValueError("Operator not allowed")
            return SAFE_OPERATORS[op_type](left, right)
        if isinstance(node, ast.UnaryOp):
            operand = _eval(node.operand)
            op_type = type(node.op)
            if op_type not in SAFE_OPERATORS:
                raise ValueError("Operator not allowed")
            return SAFE_OPERATORS[op_type](operand)
        raise ValueError("Unsupported expression")

    node = ast.parse(expr, mode="eval")
    return _eval(node.body)

class CalcTool(Tool):
    def __init__(self):
        meta = ToolMeta(
            id="calc",
            title="Calculator",
            description="Evaluate safe arithmetic expressions.",
            input_schema={"type": "object", "properties": {"expr": {"type": "string"}}, "required": ["expr"]},
            output_schema={"type": "object", "properties": {"value": {"type": "number"}}},
        )
        super().__init__(meta)

    async def call(self, params: JSON) -> JSON:
        expr = params.get("expr", "")
        if not isinstance(expr, str) or expr.strip() == "":
            return {"ok": False, "error": "expr required"}
        try:
            value = safe_eval_expr(expr)
            return {"ok": True, "value": value}
        except Exception as e:
            return {"ok": False, "error": str(e)}

# ---- Core MCP-like server: WebSocket JSON-RPC handler ----

class MCPServer:
    """
    Minimal MCP-style server:
    - Accepts WebSocket connections.
    - Expects JSON-RPC 2.0 messages with a method "call_tool" and params {"tool":..., "params":...}
    - Also supports "list_tools" method for discovery
    """
    def __init__(self, registry: ToolRegistry):
        self.registry = registry
        self.active_connections = set()

    async def handler(self, websocket: WebSocketServerProtocol, path: str):
        logger.info("Client connected: %s", websocket.remote_address)
        self.active_connections.add(websocket)
        try:
            async for raw in websocket:
                try:
                    msg = json.loads(raw)
                except Exception:
                    await websocket.send(json_dumps(make_error(None, -32700, "Parse error")))
                    continue

                # Basic JSON-RPC validation
                if not isinstance(msg, dict) or "jsonrpc" not in msg:
                    await websocket.send(json_dumps(make_error(msg.get("id"), -32600, "Invalid Request")))
                    continue

                method = msg.get("method")
                id_ = msg.get("id")
                params = msg.get("params", {})

                if method == "list_tools":
                    result = {"tools": self.registry.list_tools()}
                    await websocket.send(json_dumps(make_result(id_, result)))
                    continue

                if method == "call_tool":
                    tool_id = params.get("tool")
                    tool_params = params.get("params", {})
                    if not tool_id:
                        await websocket.send(json_dumps(make_error(id_, -32602, "Missing tool id")))
                        continue
                    tool = self.registry.get(tool_id)
                    if not tool:
                        await websocket.send(json_dumps(make_error(id_, -32601, f"Tool {tool_id} not found")))
                        continue
                    # Call tool
                    try:
                        result = await tool.call(tool_params)
                        await websocket.send(json_dumps(make_result(id_, {"ok": True, "result": result})))
                    except Exception as e:
                        tb = traceback.format_exc()
                        logger.exception("Tool call error")
                        await websocket.send(json_dumps(make_error(id_, -32000, "Tool execution error", data=str(e))))
                    continue

                # unknown method
                await websocket.send(json_dumps(make_error(id_, -32601, "Method not found")))
        except websockets.ConnectionClosedOK:
            logger.info("Connection closed (OK)")
        except Exception as e:
            logger.exception("Connection handler exception: %s", e)
        finally:
            self.active_connections.discard(websocket)
            logger.info("Client disconnected: %s", websocket.remote_address)

    async def broadcast(self, message: JSON):
        text = json_dumps(message)
        coros = []
        for conn in list(self.active_connections):
            coros.append(conn.send(text))
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)

# ---- HTTP discovery server (aiohttp) ----

def make_discovery_app(registry: ToolRegistry):
    app = web.Application()

    async def index(request):
        return web.json_response({
            "server": "mcp-lite-python",
            "version": "0.1",
            "tools": registry.list_tools(),
            "description": "Lightweight MCP-like server example. Use WebSocket for RPC.",
        })

    async def tool_meta(request):
        tid = request.match_info.get("tool_id")
        tool = registry.get(tid)
        if not tool:
            raise web.HTTPNotFound(text="tool not found")
        return web.json_response(asdict(tool.meta))

    app.add_routes([web.get("/", index), web.get("/tools/{tool_id}", tool_meta)])
    return app

# ---- Bootstrap and CLI ----

async def start_servers(ws_host="0.0.0.0", ws_port=8765, http_host="127.0.0.1", http_port=8080, base_path="."):
    registry = ToolRegistry()
    # register example tools
    registry.register(FileSystemTool(base_path=base_path))
    registry.register(CalcTool())

    mcp = MCPServer(registry=registry)

    # Start WebSocket server
    logger.info("Starting WebSocket server on %s:%d", ws_host, ws_port)
    ws_server = await websockets.serve(mcp.handler, ws_host, ws_port, max_size=2**20)  # 1MB max message

    # Start HTTP server (aiohttp)
    discovery_app = make_discovery_app(registry)
    runner = web.AppRunner(discovery_app)
    await runner.setup()
    site = web.TCPSite(runner, http_host, http_port)
    await site.start()
    logger.info("Discovery HTTP server running at http://%s:%d/", http_host, http_port)

    try:
        # Keep running until cancelled
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        logger.info("Shutting down servers...")
    finally:
        ws_server.close()
        await ws_server.wait_closed()
        await runner.cleanup()

def run_main():
    import argparse
    parser = argparse.ArgumentParser(description="Run MCP-like server")
    parser.add_argument("--ws-host", default="0.0.0.0")
    parser.add_argument("--ws-port", type=int, default=8765)
    parser.add_argument("--http-host", default="127.0.0.1")
    parser.add_argument("--http-port", type=int, default=8080)
    parser.add_argument("--base-path", default=".")
    args = parser.parse_args()
    try:
        asyncio.run(start_servers(
            ws_host=args.ws_host,
            ws_port=args.ws_port,
            http_host=args.http_host,
            http_port=args.http_port,
            base_path=args.base_path
        ))
    except KeyboardInterrupt:
        print("Interrupted")

if __name__ == "__main__":
    run_main()
