# server/core

Shared utilities for the auxiliary server.

Files:
- `logger.ts` — Winston logger factory and default logger.
- `config.ts` — lightweight config helpers (port, env).
- `health.ts` — readiness/liveness/ping handlers.
- `types.ts` — small shared types.

Usage:
Import from `server/core` in other `server/` modules.
