import express from 'express'
import http from 'http'
import routes from './routes'
import { createWs } from './ws'
import { createServerLogger } from './logger'

const app = express()
app.use(express.json())
app.use(routes)

const server = http.createServer(app)
const logger = createServerLogger()
createWs(server, logger)

const PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 4000
server.listen(PORT, () => {
  logger.info(`aux server listening ${PORT}`)
})

export { app, server }
