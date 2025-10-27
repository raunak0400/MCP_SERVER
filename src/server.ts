import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import http from 'http'
import config from './config/index.js'
import { createLogger } from './utils/logger.js'
import { Container } from './core/container.js'
import { EventBus } from './core/eventBus.js'
import { SchedulerService } from './services/schedulerService.js'
import { PluginService } from './services/pluginService.js'
import { DatabaseService } from './services/databaseService.js'
import { connectRedis, redisClient } from './cache/redis.js'
import { createRoutes } from './routes/index.js'
import { createWsHandler } from './handlers/wsHandler.js'
import { errorHandler } from './middleware/errorHandler.js'
import { McpServer } from './core/mcpServer.js'
import { initMetrics, requestMetrics } from './utils/metrics.js'
import { rateLimit } from './middleware/rateLimit.js'

const logger = createLogger(config.logLevel)
const app = express()

// Security and parsing middleware
app.use(helmet())
app.use(cors({
  origin: config.isProd ? process.env.CORS_ORIGIN || false : '*',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// initialize metrics and instrument all requests
initMetrics()
app.use(requestMetrics())
// apply a sensible global rate limit (60 req capacity with 1 token/sec refill per IP)
app.use(rateLimit({ capacity: 60, refillPerSec: 1, key: 'ip' }))

const server = http.createServer(app)
const container = new Container()
const events = new EventBus()
const scheduler = new SchedulerService(logger)
const plugins = new PluginService(logger, events)
const db = new DatabaseService()

// Connect to external services first
const connectedDb = await db.connect()
if (!connectedDb) {
  logger.error('Database connection failed, aborting startup')
  process.exit(1)
}

// ensure indexes
await db.createIndexes()

// connect redis (best-effort)
try {
  await connectRedis()
  logger.info('✅ Redis connected')
} catch (err: any) {
  logger.warn('Redis connection failed (continuing without cache):', err.message)
}

// Load plugins after DB is ready
await plugins.loadAll()

container.register('logger', logger)
container.register('events', events)
container.register('scheduler', scheduler)
container.register('plugins', plugins)
container.register('db', db)
container.register('redis', redisClient)
container.register('mcp', new McpServer(plugins, events))

app.use(createRoutes(container))
app.use(errorHandler)

createWsHandler(server, events)

scheduler.start()

const startServer = async () => {
  try {
    server.listen(config.port, () => {
      logger.info(`MCP Server listening on port ${config.port}`)
      logger.info(`Environment: ${config.env}`)
      events.emit('started')
    })
  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`)
  
  server.close(() => {
    logger.info('HTTP server closed')
  })
  
  scheduler.stop()
  try {
    await db.disconnect()
    logger.info('Database disconnected')
  } catch (err: any) {
    logger.warn('Error disconnecting database:', err.message)
  }

  try {
    await redisClient.disconnect()
    logger.info('Redis disconnected')
  } catch (err: any) {
    logger.warn('Error disconnecting redis:', err.message)
  }
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

startServer()
