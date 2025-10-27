import { Router } from 'express'
import { Container } from '../core/container.js'

export const websocketRouter = (container: Container) => {
  const router = Router()

  router.get('/ws/info', (req, res) => {
    res.json({ 
      ok: true, 
      info: {
        endpoint: 'ws://localhost:3000',
        protocol: 'WebSocket',
        events: ['pluginLoaded', 'pluginExecuted', 'started']
      }
    })
  })

  return router
}
