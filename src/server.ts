import express from 'express'
import helmet from 'helmet'
import http from 'http'
import config from './config/index.js'
import { createLogger } from './utils/logger.js'
import { Container } from './core/container.js'
import { EventBus } from './core/eventBus.js'
import { SchedulerService } from './services/schedulerService.js'
import { PluginService } from './services/pluginService.js'
import { createRoutes } from './routes/index.js'
import { createWsHandler } from './handlers/wsHandler.js'
import { errorHandler } from './middleware/errorHandler.js'
import { McpServer } from './core/mcpServer.js'
import { initMetrics, requestMetrics } from './utils/metrics.js'
import { rateLimit } from './middleware/rateLimit.js'

const logger = createLogger(config.logLevel)
const app = express()
app.use(helmet())
app.use(express.json())
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

await plugins.loadAll()
container.register('logger', logger)
container.register('events', events)
container.register('scheduler', scheduler)
container.register('plugins', plugins)
container.register('mcp', new McpServer(plugins, events))

app.use(createRoutes(container))
app.use(errorHandler)

createWsHandler(server, events)

scheduler.start()

server.listen(config.port, () => {
  logger.info(`server listening ${config.port}`)
  events.emit('started')
})
