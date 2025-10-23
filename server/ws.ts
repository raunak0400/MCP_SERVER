import { Server as HttpServer } from 'http'
import { WebSocketServer } from 'ws'
import type { Logger } from '../src/utils/logger'

export const createWs = (server: HttpServer, logger: any) => {
  const wss = new WebSocketServer({ server })
  wss.on('connection', (ws) => {
    logger.info('server/ws: client connected')
    ws.on('message', (msg) => {
      try {
        const data = typeof msg === 'string' ? msg : msg.toString()
        logger.info('server/ws: received ' + data)
        ws.send(JSON.stringify({ ok: true, echo: data }))
      } catch (e) {
        logger.error('server/ws: message error')
      }
    })
    ws.on('close', () => logger.info('server/ws: client disconnected'))
  })
  return wss
}
