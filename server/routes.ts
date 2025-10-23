import express, { type Request, type Response } from 'express'
import { createServerLogger } from './logger'
import config from './config'

const router = express.Router()
const logger = createServerLogger()

// Health endpoint - lightweight
router.get('/server/health', (_req: Request, res: Response) => {
  res.json({ ok: true, server: 'aux-server', env: config.env })
})

// Full info - useful for diagnostics (no secrets)
router.get('/server/info', (_req: Request, res: Response) => {
  res.json({ ok: true, pid: process.pid, uptimeSec: Math.round(process.uptime()), env: config.env })
})

// Echo endpoint for testing
router.post('/server/echo', (req: Request, res: Response) => {
  const payload = req.body
  logger.info('echo', { payload })
  res.json({ ok: true, echo: payload })
})

// Simple health page
router.get('/server/health.html', (_req: Request, res: Response) => {
  res.sendFile('health.html', { root: __dirname })
})

export default router
