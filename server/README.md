# Auxiliary Server for MCP_SERVER

This folder contains a small auxiliary server that can run alongside the main MCP server. It exposes a few helpful endpoints for health, info, and WebSocket testing.

Files:
- `index.ts` - startup file
- `routes.ts` - simple HTTP routes
- `ws.ts` - WebSocket handler
- `logger.ts` - basic Winston logger

Run locally for quick integration tests or as a separate process in production.
