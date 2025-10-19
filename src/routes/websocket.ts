import { Router } from 'express'
import { WebSocketService } from '../../websocket/service.js'
import { Container } from '../core/container.js'

export const websocketRouter = (container: Container) => {
  const router = Router()

  router.get('/ws/stats', (req, res) => {
    const wsService = container.resolve<WebSocketService>('websocket')
    const stats = wsService.getStats()
    res.json({ ok: true, stats })
  })

  router.post('/ws/broadcast', (req, res) => {
    const wsService = container.resolve<WebSocketService>('websocket')
    const { message } = req.body
    wsService.broadcast({ type: 'broadcast', payload: message, timestamp: Date.now() })
    res.json({ ok: true })
  })

  router.post('/ws/send', (req, res) => {
    const wsService = container.resolve<WebSocketService>('websocket')
    const { clientId, message } = req.body
    wsService.sendToClient(clientId, { type: 'message', payload: message, timestamp: Date.now() })
    res.json({ ok: true })
  })

  return router
}
