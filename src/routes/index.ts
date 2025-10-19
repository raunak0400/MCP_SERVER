import { Router } from 'express'
import { healthRouter } from './health.js'
import { mcpRouter } from './mcp.js'
import { Container } from '../core/container.js'

export const createRoutes = (container: Container) => {
  const router = Router()
  router.use(healthRouter)
  router.use(mcpRouter(container))
  return router
}
