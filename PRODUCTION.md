# Production Deployment Guide

## Prerequisites

Before deploying the MCP Server to production, ensure you have:

- Node.js 20+ installed
- Docker and Docker Compose (for containerized deployment)
- Redis server (or use Docker)
- Valid API keys for OpenAI/Anthropic (if using LLM features)
- SSL/TLS certificates (for HTTPS)

## Environment Configuration

### 1. Create Production Environment File

Copy `.env.example` to `.env` and configure:

```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis Configuration
REDIS_URL=redis://localhost:6379

# LLM API Keys (optional)
OPENAI_API_KEY=sk-your-actual-openai-key
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key
LLM_PROVIDER=openai

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Security
JWT_SECRET=your-secure-random-string
```

### 2. Install Dependencies

```bash
npm ci --production
```

## Deployment Options

### Option 1: Direct Node.js Deployment

#### Build the Project

```bash
npm run build
```

#### Start the Server

```bash
npm run start:prod
```

#### Use Process Manager (PM2)

Install PM2:
```bash
npm install -g pm2
```

Start the server:
```bash
pm2 start dist/server.js --name mcp-server
pm2 save
pm2 startup
```

Monitor:
```bash
pm2 monit
pm2 logs mcp-server
```

### Option 2: Docker Deployment

#### Build Docker Image

```bash
docker build -t mcp-server:latest .
```

#### Run Container

```bash
docker run -d \
  --name mcp-server \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  mcp-server:latest
```

### Option 3: Docker Compose (Recommended)

This includes MCP Server, Redis, and Nginx reverse proxy.

```bash
docker-compose up -d
```

Check status:
```bash
docker-compose ps
docker-compose logs -f
```

Stop services:
```bash
docker-compose down
```

### Option 4: Kubernetes Deployment

Apply the manifests:

```bash
kubectl apply -f deploy.yaml
kubectl apply -f service.yaml
```

Check deployment:
```bash
kubectl get pods
kubectl get services
kubectl logs -f deployment/mcp-server
```

## Nginx Reverse Proxy Configuration

The included `nginx.conf` provides:
- Load balancing
- SSL/TLS termination
- WebSocket support
- Rate limiting
- Gzip compression

Update `nginx.conf` with your domain and SSL certificates.

## Security Checklist

### Before Going to Production:

- [ ] Update all API keys and secrets in `.env`
- [ ] Enable HTTPS/TLS with valid certificates
- [ ] Configure CORS with specific origins (not `*`)
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure Redis authentication
- [ ] Review and update security headers in `helmet`
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Implement backup strategy
- [ ] Test disaster recovery procedures

## Environment Variables

### Required

- `NODE_ENV`: Set to `production`
- `PORT`: Server port (default: 3000)

### Optional

- `LOG_LEVEL`: Logging level (error, warn, info, debug)
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for LLM features
- `ANTHROPIC_API_KEY`: Anthropic API key for LLM features
- `LLM_PROVIDER`: LLM provider (openai or anthropic)
- `CORS_ORIGIN`: Allowed CORS origins

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"ok": true}
```

### Metrics Endpoint

```bash
curl http://localhost:3000/metrics
```

Returns server metrics including:
- Request count
- Error count
- Response times
- Active connections

### Log Files

Logs are output to stdout/stderr. Configure log aggregation:

- **Docker**: Use Docker logging drivers
- **PM2**: Logs in `~/.pm2/logs/`
- **Kubernetes**: Use `kubectl logs` or log aggregation service

## Scaling

### Horizontal Scaling

The MCP Server is stateless and can be horizontally scaled:

1. **Docker Compose**: Increase replicas
```bash
docker-compose up -d --scale mcp-server=3
```

2. **Kubernetes**: Update replicas in `deploy.yaml`
```bash
kubectl scale deployment mcp-server --replicas=5
```

3. **Load Balancer**: Configure Nginx or cloud load balancer

### Vertical Scaling

Adjust container resources in `docker-compose.yml`:

```yaml
services:
  mcp-server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

## Performance Optimization

### Redis Caching

Enable Redis for caching:
- Plugin results
- LLM responses
- Session data

### Connection Pooling

The server maintains connection pools for:
- Redis connections
- HTTP keep-alive

### Compression

Nginx handles gzip compression for HTTP responses.

## Backup and Recovery

### Redis Data Backup

```bash
# Backup Redis data
docker-compose exec redis redis-cli SAVE
docker cp mcp-redis:/data/dump.rdb ./backup/

# Restore Redis data
docker cp ./backup/dump.rdb mcp-redis:/data/
docker-compose restart redis
```

### Application Backup

Backup essential files:
- `.env` (securely)
- `src/plugins/` directory
- Custom configuration files

## Troubleshooting

### Server Won't Start

Check logs:
```bash
# Docker
docker-compose logs mcp-server

# PM2
pm2 logs mcp-server

# Direct
node dist/server.js
```

### Redis Connection Issues

Test Redis:
```bash
docker-compose exec redis redis-cli ping
```

### High Memory Usage

Monitor with:
```bash
docker stats
# or
pm2 monit
```

### Port Already in Use

Find and kill process:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Updates and Maintenance

### Zero-Downtime Updates

1. **Using PM2**:
```bash
pm2 reload mcp-server
```

2. **Using Docker**:
```bash
docker-compose build
docker-compose up -d --no-deps mcp-server
```

3. **Using Kubernetes**:
```bash
kubectl rollout restart deployment/mcp-server
kubectl rollout status deployment/mcp-server
```

### Database Migrations

Currently not applicable (no persistent database). For future:
- Run migrations before deployment
- Use versioned migrations
- Test rollback procedures

## Monitoring and Alerts

### Recommended Tools

- **Application Monitoring**: New Relic, DataDog, Prometheus
- **Log Aggregation**: ELK Stack, Splunk, CloudWatch
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Error Tracking**: Sentry, Rollbar

### Sample Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'mcp-server'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

## Security Best Practices

### API Key Management

- Never commit API keys to version control
- Use environment variables or secret management services
- Rotate keys regularly
- Use different keys for different environments

### Network Security

- Use HTTPS in production
- Configure firewall rules
- Implement rate limiting
- Use VPC/private networks for internal services

### Application Security

- Keep dependencies updated
- Run security audits: `npm audit`
- Implement authentication/authorization
- Sanitize user inputs
- Use helmet.js security headers

## Cost Optimization

### Cloud Deployment

- Use auto-scaling to match demand
- Choose appropriate instance sizes
- Cache LLM responses to reduce API costs
- Monitor and optimize resource usage

### Redis Optimization

- Configure eviction policies
- Set appropriate memory limits
- Use connection pooling

## Compliance

Ensure compliance with:
- GDPR (if handling EU user data)
- SOC 2 (for enterprise customers)
- HIPAA (if handling health data)
- Industry-specific regulations

## Support and Documentation

- [Main README](./README.md)
- [API Documentation](./docs/API.md)
- [Plugin Development Guide](./docs/PLUGIN_GUIDE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)

## Contact

For production support:
- GitHub Issues: https://github.com/raunak0400/MCP_SERVER/issues
- Email: support@yourdomain.com

---

**Important**: Always test deployments in a staging environment before production!
