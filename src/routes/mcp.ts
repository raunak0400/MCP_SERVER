import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validation.js'
import { Container } from '../core/container.js'
import { McpServer } from '../core/mcpServer.js'

export const mcpRouter = (container: Container) => {
  const router = Router()
  const schema = z.object({ body: z.object({ plugin: z.string(), action: z.string(), payload: z.any().optional() }) })
  router.post('/mcp/execute', validate(schema), async (req, res, next) => {
    try {
      const mcp = container.resolve<McpServer>('mcp')
      const { plugin, action, payload } = req.body
      const result = await mcp.execute(plugin, action, payload)
      res.json({ ok: true, result })
    } catch (e) {
      next(e)
    }
  })
  return router
}
