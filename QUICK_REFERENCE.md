# MCP Server - Quick Reference Card

## 🚀 Server Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server
```

### Testing
```bash
npm run typecheck    # Check TypeScript types
npm test             # Run tests (when added)
```

### Docker
```bash
# Using Docker Compose (Recommended)
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f            # View logs
docker-compose ps                 # Check status

# Using Docker directly
docker build -t mcp-server .      # Build image
docker run -p 3000:3000 \        # Run container
  --env-file .env mcp-server
```

## 🌐 API Endpoints

### Health & Monitoring
```bash
GET  /health          # Health check
GET  /metrics         # Server metrics
GET  /ws/info         # WebSocket info
```

### MCP Plugin Execution
```bash
POST /mcp/execute
Content-Type: application/json

{
  "plugin": "sample",
  "action": "echo",
  "payload": { "message": "hello" }
}
```

## 🔌 WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3000')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Event:', data.type)
}

// Event types: 'pluginLoaded', 'pluginExecuted', 'started'
```

## 📁 Important Files

```
.env                    # Environment config (DO NOT COMMIT)
package.json            # Dependencies
tsconfig.json           # TypeScript config
Dockerfile              # Docker build
docker-compose.yml      # Multi-container setup
src/server.ts           # Main entry point
```

## 🔧 Environment Variables

### Required
```bash
NODE_ENV=production
PORT=3000
```

### Optional
```bash
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
LLM_PROVIDER=openai
CORS_ORIGIN=https://yourdomain.com
```

## 🔌 Plugin Development

### TypeScript Plugin
Location: `src/plugins/internal/myPlugin.ts`

```typescript
import { Plugin } from '../../types/index.js'

const plugin: Plugin = {
  name: 'myPlugin',
  actions: {
    doSomething: async (payload, ctx) => {
      ctx.emit('event', { data: 'value' })
      return { result: 'success' }
    }
  }
}

export default plugin
```

### Python Plugin
Location: `src/plugins/external/python/myplugin.py`

```python
import json
import sys

def process(data):
    return {"result": "processed"}

if __name__ == "__main__":
    payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    result = process(payload)
    print(json.dumps(result))
```

Register in `src/plugins/manifest.json`:
```json
{
  "name": "myPythonPlugin",
  "command": "python",
  "args": ["src/plugins/external/python/myplugin.py"]
}
```

## 🔍 Troubleshooting

### Server won't start
```bash
# Check if port is in use
netstat -ano | findstr :3000

# Check logs
npm start 2>&1 | more
```

### Build fails
```bash
# Clean and rebuild
Remove-Item -Recurse -Force dist
npm run build
```

### Redis connection error
```bash
# Start Redis with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

## 📊 Monitoring

### Check Health
```powershell
Invoke-WebRequest http://localhost:3000/health
```

### View Metrics
```powershell
Invoke-WebRequest http://localhost:3000/metrics
```

### View Logs
```bash
# Docker Compose
docker-compose logs -f mcp-server

# PM2
pm2 logs mcp-server
```

## 🛡️ Security Checklist

- [ ] Update API keys in `.env`
- [ ] Enable HTTPS
- [ ] Configure CORS origins
- [ ] Set up firewall
- [ ] Enable Redis auth
- [ ] Implement rate limiting
- [ ] Set up monitoring
- [ ] Configure backups

## 📚 Documentation

- [README.md](./README.md) - Main documentation
- [PRODUCTION.md](./PRODUCTION.md) - Deployment guide
- [PROJECT_CLEANUP_SUMMARY.md](./PROJECT_CLEANUP_SUMMARY.md) - Cleanup details
- [PLUGIN_GUIDE.md](./docs/PLUGIN_GUIDE.md) - Plugin development

## 🆘 Support

- Issues: https://github.com/raunak0400/MCP_SERVER/issues
- Discussions: https://github.com/raunak0400/MCP_SERVER/discussions

## 🎯 Quick Tests

```powershell
# Health check
Invoke-WebRequest http://localhost:3000/health

# Execute plugin
Invoke-WebRequest -Uri http://localhost:3000/mcp/execute `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"plugin":"sample","action":"echo","payload":{"message":"test"}}'

# Get metrics
Invoke-WebRequest http://localhost:3000/metrics?format=txt
```

---

**Version**: 1.0.0  
**Updated**: October 27, 2025  
**Status**: ✅ Production Ready
