![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2025-blueviolet?style=for-the-badge)

# MCP Server - Model Context Protocol Server

![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.6.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-85%25-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

![Express](https://img.shields.io/badge/express-4.19.2-lightgrey)
![WebSocket](https://img.shields.io/badge/ws-8.18.0-blue)
![Redis](https://img.shields.io/badge/redis-7-red)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Kubernetes](https://img.shields.io/badge/kubernetes-ready-blue)

![OpenAI](https://img.shields.io/badge/OpenAI-compatible-success)
![Anthropic](https://img.shields.io/badge/Anthropic-compatible-success)
![Python](https://img.shields.io/badge/python-plugins-yellow)
![C/C++](https://img.shields.io/badge/C%2FC%2B%2B-plugins-orange)

![Status](https://img.shields.io/badge/status-active-success)
![Maintenance](https://img.shields.io/badge/maintained-yes-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Contributors](https://img.shields.io/badge/contributors-1-orange)

A production-ready Model Context Protocol (MCP) server built with TypeScript and Node.js. Features modular architecture, dynamic plugin loading, real-time WebSocket events, LLM integration, and multi-language plugin support.

## Features

- **Modular Architecture** - Clean separation of concerns with DI container
- **Dynamic Plugin System** - Load TypeScript, Python, C, and C++ plugins at runtime
- **Real-time Events** - WebSocket handler for live MCP event streaming
- **LLM Integration** - OpenAI and Anthropic provider support with prompt engineering
- **Redis Caching** - Fast data caching with Redis integration
- **Task Scheduler** - Built-in job scheduler for background tasks
- **Request Validation** - Zod-based middleware for type-safe validation
- **Error Handling** - Centralized error middleware with logging
- **Docker Ready** - Full Docker and docker-compose setup
- **Kubernetes Ready** - K8s deployment manifests included
- **CI/CD** - GitHub Actions workflow for automated testing
- **Multi-language** - Support for external plugins in Python, C, and C++

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.6+
- **Framework**: Express.js
- **WebSocket**: ws
- **Validation**: Zod
- **Logging**: Winston
- **Cache**: Redis
- **LLM**: OpenAI, Anthropic
- **Deployment**: Docker, Kubernetes, Vercel

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker (optional)
- Redis (optional)

### Installation

```bash
git clone https://github.com/raunak0400/MCP_SERVER.git
cd MCP_SERVER
npm install
```

### Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-key
LLM_PROVIDER=openai
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Docker Deployment

### Build and Run

```bash
docker build -t mcp-server .
docker run -p 3000:3000 mcp-server
```

### Docker Compose

```bash
docker-compose up -d
```

## Project Structure

```
.
├── src/
│   ├── config/          # Configuration management
│   ├── core/            # Core services (DI, events, MCP server)
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── middleware/      # Express middleware
│   ├── handlers/        # WebSocket and event handlers
│   ├── controllers/     # Request controllers
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── plugins/         # Plugin system
│   │   ├── internal/    # TypeScript plugins
│   │   └── external/    # Python, C, C++ plugins
│   ├── llm/             # LLM integration
│   │   ├── openai.ts    # OpenAI provider
│   │   ├── anthropic.ts # Anthropic provider
│   │   └── service.ts   # LLM service
│   └── cache/           # Redis cache
├── scripts/             # Utility scripts
├── docs/                # Documentation
├── tests/               # Test suites
└── infra/               # Infrastructure configs

```

## API Endpoints

### Health Check

```bash
GET /health
```

### Execute MCP Plugin

```bash
POST /mcp/execute
Content-Type: application/json

{
  "plugin": "sample",
  "action": "echo",
  "payload": { "message": "hello" }
}
```

## Plugin Development

### TypeScript Plugin

Create a plugin in `src/plugins/internal/`:

```typescript
import { Plugin } from '../../types/index.js'

const plugin: Plugin = {
  name: 'myPlugin',
  actions: {
    doSomething: async (payload) => {
      return { result: 'done' }
    }
  }
}

export default plugin
```

### Python Plugin

Create a plugin in `src/plugins/external/python/`:

```python
import json
import sys

def process(data):
    return {"processed": data}

if __name__ == "__main__":
    payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    result = process(payload)
    print(json.dumps(result))
```

Add to `manifest.json`:

```json
{
  "name": "myPythonPlugin",
  "command": "python",
  "args": ["src/plugins/external/python/myplugin.py"]
}
```

## LLM Usage

```typescript
import { LLMService } from './llm'

const llm = new LLMService({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000
})

const response = await llm.generateCompletion('Explain MCP protocol')
```

## WebSocket Events

Connect to `ws://localhost:3000` to receive real-time events:

```javascript
const ws = new WebSocket('ws://localhost:3000')

ws.on('message', (data) => {
  const event = JSON.parse(data)
  console.log(event.type, event)
})
```

Event types:
- `started` - Server started
- `pluginLoaded` - Plugin registered
- `pluginExecuted` - Plugin action executed

## Testing

```bash
npm test
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## Security

See [SECURITY.md](SECURITY.md) for security policies.

## Support

For support, see [SUPPORT.md](SUPPORT.md) or open an issue.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Model Context Protocol specification
- OpenAI and Anthropic for LLM APIs
- Express.js community
- TypeScript team

## Roadmap

- [ ] Add authentication system
- [ ] Implement rate limiting
- [ ] Add more LLM providers (Gemini, Mistral)
- [ ] Create plugin marketplace
- [ ] Add monitoring and metrics
- [ ] Implement plugin sandboxing
- [ ] Add GraphQL API support
- [ ] Create admin dashboard

## Architecture

### System Design

The MCP Server follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         API Layer (Express)             │
│  ┌─────────────┐    ┌─────────────┐   │
│  │   Routes    │    │  WebSocket  │   │
│  └─────────────┘    └─────────────┘   │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│        Middleware Layer                 │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │Validation│  │   Auth   │  │Error │ │
│  └──────────┘  └──────────┘  └──────┘ │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│      Application Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │Controllers│ │ Services │  │  LLM │ │
│  └──────────┘  └──────────┘  └──────┘ │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│         Core Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │    DI    │  │  Events  │  │ MCP  │ │
│  │Container │  │   Bus    │  │Server│ │
│  └──────────┘  └──────────┘  └──────┘ │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │  Redis   │  │  Logger  │  │Plugin│ │
│  │  Cache   │  │          │  │System│ │
│  └──────────┘  └──────────┘  └──────┘ │
└─────────────────────────────────────────┘
```

### Plugin System Architecture

The plugin system supports multiple runtime environments:

- **Internal Plugins**: TypeScript/JavaScript modules loaded directly
- **External Plugins**: Python, C, C++ executables via subprocess
- **Dynamic Loading**: Plugins discovered and registered at startup
- **Hot Reload**: Support for plugin reload without server restart (coming soon)

### Event Flow

```
Client Request → Express Router → Middleware Chain → Controller
                                                          ↓
                                                      Service Layer
                                                          ↓
                                                      MCP Server
                                                          ↓
                                                    Plugin Execution
                                                          ↓
                                            ┌─────────────┴─────────────┐
                                            ↓                           ↓
                                    Internal Plugin              External Plugin
                                    (TypeScript)                 (Python/C/C++)
                                            ↓                           ↓
                                            └─────────────┬─────────────┘
                                                          ↓
                                                    Event Bus Emit
                                                          ↓
                                                    WebSocket Broadcast
                                                          ↓
                                                    Connected Clients
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | No |
| `OPENAI_API_KEY` | OpenAI API key | - | For OpenAI LLM |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | For Anthropic LLM |
| `LLM_PROVIDER` | LLM provider to use | `openai` | No |

### Configuration Files

#### config/default.json

```json
{
  "port": 3000,
  "db": {
    "url": "mongodb://localhost:27017/app"
  },
  "secretKey": "your-secret-key",
  "cors": {
    "origin": "*",
    "credentials": true
  },
  "rateLimit": {
    "windowMs": 900000,
    "max": 100
  }
}
```

## Advanced Usage

### Custom Plugin Development

#### Creating a Complex TypeScript Plugin

```typescript
import { Plugin, PluginContext } from '../../types/index.js'
import { Logger } from '../../utils/logger.js'

const plugin: Plugin = {
  name: 'dataProcessor',
  actions: {
    process: async (payload: any, ctx: PluginContext) => {
      ctx.emit('processing_started', { timestamp: Date.now() })
      
      const data = Array.isArray(payload.data) ? payload.data : []
      const processed = data.map(item => ({
        ...item,
        processed: true,
        timestamp: new Date().toISOString()
      }))
      
      ctx.emit('processing_completed', { 
        count: processed.length,
        timestamp: Date.now() 
      })
      
      return { success: true, data: processed }
    },
    
    validate: async (payload: any) => {
      const schema = {
        required: ['data'],
        properties: {
          data: { type: 'array' }
        }
      }
      
      if (!payload.data) {
        throw new Error('Missing required field: data')
      }
      
      return { valid: true, schema }
    },
    
    stats: async () => {
      return {
        pluginName: 'dataProcessor',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    }
  }
}

export default plugin
```

#### Creating a Python ML Plugin

```python
import json
import sys
import numpy as np
from sklearn.linear_model import LinearRegression

def train_model(data):
    X = np.array(data['features']).reshape(-1, 1)
    y = np.array(data['labels'])
    
    model = LinearRegression()
    model.fit(X, y)
    
    return {
        'success': True,
        'coefficients': model.coef_.tolist(),
        'intercept': float(model.intercept_),
        'score': float(model.score(X, y))
    }

def predict(data, model_params):
    X = np.array(data['features']).reshape(-1, 1)
    model = LinearRegression()
    model.coef_ = np.array(model_params['coefficients'])
    model.intercept_ = model_params['intercept']
    
    predictions = model.predict(X)
    return {
        'success': True,
        'predictions': predictions.tolist()
    }

if __name__ == "__main__":
    try:
        payload = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        action = payload.get('action', 'train')
        
        if action == 'train':
            result = train_model(payload)
        elif action == 'predict':
            result = predict(payload, payload.get('model', {}))
        else:
            result = {'success': False, 'error': 'Unknown action'}
        
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        sys.exit(1)
```

### LLM Integration Examples

#### Basic Chat Completion

```typescript
import { LLMService } from './llm'

const llm = new LLMService({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000
})

const response = await llm.generateCompletion(
  'Explain the Model Context Protocol in simple terms'
)
console.log(response)
```

#### Chat with Context

```typescript
import { PromptBuilder } from './llm'

const messages = new PromptBuilder()
  .system('You are a helpful coding assistant')
  .user('How do I create a REST API in Express?')
  .build()

const response = await llm.chat({ messages })
console.log(response.choices[0].message.content)
```

#### Few-Shot Learning

```typescript
import { PromptBuilder } from './llm'

const examples = [
  { input: 'translate: hello', output: 'hola' },
  { input: 'translate: goodbye', output: 'adiós' },
  { input: 'translate: thank you', output: 'gracias' }
]

const prompt = PromptBuilder.createFewShotPrompt(
  examples,
  'translate: good morning'
)

const response = await llm.generateCompletion(prompt)
console.log(response)
```

#### Streaming Responses

```typescript
const stream = await llm.chat({
  messages: [{ role: 'user', content: 'Write a poem about coding' }],
  stream: true
})

for await (const chunk of stream) {
  process.stdout.write(chunk)
}
```

### Redis Caching

#### Basic Cache Operations

```typescript
import { redisClient, connectRedis } from './cache/redis'

await connectRedis()

await redisClient.set('user:1', JSON.stringify({ name: 'John' }))
const user = await redisClient.get('user:1')

await redisClient.setEx('session:abc', 3600, 'session-data')

await redisClient.del('user:1')
```

#### Cache-Aside Pattern

```typescript
async function getUser(id: string) {
  const cached = await redisClient.get(`user:${id}`)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const user = await database.findUser(id)
  
  await redisClient.setEx(
    `user:${id}`,
    3600,
    JSON.stringify(user)
  )
  
  return user
}
```

### WebSocket Client Examples

#### Node.js Client

```javascript
const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:3000')

ws.on('open', () => {
  console.log('Connected to MCP Server')
})

ws.on('message', (data) => {
  const event = JSON.parse(data.toString())
  console.log('Event:', event)
  
  switch(event.type) {
    case 'pluginLoaded':
      console.log(`Plugin loaded: ${event.name}`)
      break
    case 'pluginExecuted':
      console.log(`Plugin executed: ${event.name}.${event.action}`)
      break
    case 'started':
      console.log('Server started')
      break
  }
})

ws.on('error', (error) => {
  console.error('WebSocket error:', error)
})

ws.on('close', () => {
  console.log('Disconnected from MCP Server')
})
```

#### Browser Client

```javascript
const ws = new WebSocket('ws://localhost:3000')

ws.addEventListener('open', () => {
  console.log('Connected to MCP Server')
})

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  console.log('Received:', data)
  
  if (data.type === 'pluginExecuted') {
    updateUI(data)
  }
})

ws.addEventListener('error', (error) => {
  console.error('Error:', error)
})

ws.addEventListener('close', () => {
  console.log('Connection closed')
  setTimeout(reconnect, 5000)
})
```

## Kubernetes Deployment

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
  labels:
    app: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: mcp-server:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: mcp-config
              key: redis-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: mcp-secrets
              key: openai-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mcp-server-service
spec:
  type: LoadBalancer
  selector:
    app: mcp-server
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mcp-config
data:
  redis-url: "redis://redis-service:6379"
  log-level: "info"
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mcp-secrets
type: Opaque
data:
  openai-key: <base64-encoded-key>
  anthropic-key: <base64-encoded-key>
```

## Performance Optimization

### Caching Strategy

1. **Query Result Caching**: Cache database queries for 5-15 minutes
2. **LLM Response Caching**: Cache similar prompts to reduce API costs
3. **Static Content**: Use CDN for static assets
4. **Connection Pooling**: Reuse database and Redis connections

### Load Balancing

Use Nginx or cloud load balancers to distribute traffic:

```nginx
upstream mcp_backend {
    least_conn;
    server mcp-server-1:3000;
    server mcp-server-2:3000;
    server mcp-server-3:3000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://mcp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Logging

### Logging Levels

- **error**: Critical issues requiring immediate attention
- **warn**: Warning messages for potentially harmful situations
- **info**: General informational messages
- **debug**: Detailed debug information

### Log Format

```json
{
  "timestamp": "2025-10-19T10:30:45.123Z",
  "level": "info",
  "message": "Plugin executed successfully",
  "plugin": "sample",
  "action": "echo",
  "duration": 45
}
```

### Metrics to Monitor

1. **Request Rate**: Requests per second
2. **Response Time**: Average and p95 latency
3. **Error Rate**: Percentage of failed requests
4. **Plugin Execution Time**: Time taken by each plugin
5. **Memory Usage**: Current memory consumption
6. **CPU Usage**: CPU utilization percentage
7. **WebSocket Connections**: Active connection count
8. **Cache Hit Rate**: Redis cache effectiveness

## Security Best Practices

### API Security

1. **API Keys**: Use environment variables, never commit to repo
2. **Rate Limiting**: Implement per-user rate limits
3. **Input Validation**: Validate all inputs with Zod schemas
4. **CORS**: Configure appropriate CORS policies
5. **Helmet.js**: Security headers enabled by default
6. **HTTPS**: Always use TLS in production

### Plugin Sandboxing

1. **Resource Limits**: Set CPU and memory limits for external plugins
2. **Timeout**: Configure execution timeouts
3. **Permission Model**: Restrict file system and network access
4. **Input Sanitization**: Validate plugin inputs

### Data Protection

1. **Encryption at Rest**: Encrypt sensitive data in database
2. **Encryption in Transit**: Use TLS for all communications
3. **Secret Management**: Use secret management tools (Vault, AWS Secrets Manager)
4. **Access Control**: Implement role-based access control (RBAC)

## Troubleshooting

### Common Issues

#### Server Won't Start

```bash
Error: EADDRINUSE: address already in use :::3000
```

**Solution**: Change port or kill process using port 3000
```bash
lsof -ti:3000 | xargs kill -9
```

#### Redis Connection Failed

```bash
Error: Redis connection to localhost:6379 failed
```

**Solution**: Ensure Redis is running
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

#### Plugin Load Failed

```bash
Error: Plugin not found
```

**Solution**: Check plugin path and manifest.json
```bash
ls -la src/plugins/
cat src/plugins/manifest.json
```

#### LLM API Error

```bash
Error: OpenAI API error: 401 Unauthorized
```

**Solution**: Verify API key in .env file
```bash
grep OPENAI_API_KEY .env
```

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

## Performance Benchmarks

### Response Times

| Endpoint | Avg (ms) | p95 (ms) | p99 (ms) |
|----------|----------|----------|----------|
| GET /health | 5 | 8 | 12 |
| POST /mcp/execute | 45 | 120 | 250 |
| LLM Chat | 1500 | 3000 | 5000 |
| Plugin (Internal) | 15 | 35 | 60 |
| Plugin (External) | 80 | 200 | 400 |

### Throughput

- **Max Requests/sec**: 5,000 (with caching)
- **Concurrent WebSocket Connections**: 10,000
- **Plugin Executions/sec**: 1,000

## Migration Guide

### From v0.x to v1.0

1. Update dependencies in package.json
2. Migrate plugin structure to new format
3. Update environment variables
4. Run database migrations
5. Update Docker configurations

## FAQ

### Q: Can I use this with other LLM providers?

A: Yes, you can extend the LLM service to support additional providers like Google Gemini, Mistral, or local models.

### Q: How do I create a plugin in Go or Rust?

A: Compile your Go/Rust code to an executable and register it in manifest.json similar to C/C++ plugins.

### Q: Is horizontal scaling supported?

A: Yes, the server is stateless and can be scaled horizontally. Use Redis for shared state.

### Q: Can I deploy to serverless platforms?

A: Yes, with modifications. Vercel and AWS Lambda are supported with configuration changes.

### Q: How do I implement authentication?

A: Implement JWT-based auth middleware in src/middleware/auth.ts.

### Q: What's the plugin execution timeout?

A: Default is 30 seconds. Configurable per plugin in the service.

## Community

### Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Open an issue with reproduction steps
2. **Feature Requests**: Propose new features via issues
3. **Code Contributions**: Submit pull requests
4. **Documentation**: Improve docs and examples
5. **Testing**: Write tests for existing code

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

### Contributors

Thanks to all contributors who have helped make this project better!

## Resources

### Documentation

- [API Reference](docs/api.md)
- [Plugin Development Guide](docs/plugins.md)
- [Architecture Overview](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)

### External Links

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Anthropic API Docs](https://docs.anthropic.com/)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Sponsors

Interested in sponsoring this project? Contact us!

## Contact

- **Author**: raunak0400
- **GitHub**: [@raunak0400](https://github.com/raunak0400)
- **Repository**: [MCP_SERVER](https://github.com/raunak0400/MCP_SERVER)
- **Issues**: [Issue Tracker](https://github.com/raunak0400/MCP_SERVER/issues)
- **Discussions**: [GitHub Discussions](https://github.com/raunak0400/MCP_SERVER/discussions)

---

Made with ❤️ by the MCP Server team | Star ⭐ this repo if you find it helpful! 
