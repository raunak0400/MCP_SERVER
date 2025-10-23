Add server core utilities

Create a lightweight `server/core` module that centralizes common utilities
used by the auxiliary server. The new files provide a Winston-based logger,
basic configuration helpers, and small health-check handlers.

Files added:
- server/core/logger.ts
- server/core/config.ts
- server/core/health.ts
- server/core/types.ts
- server/core/index.ts
- server/core/README.md

This change is focused, low-risk, and prepares the `server/` folder for
additional route and WebSocket wiring that rely on shared utilities.

Run `npm install` then `npm run typecheck` to ensure types are resolved.
