import { Router, type Request, type Response } from 'express'
import { formatMetricsText, getMetricsSnapshot } from '../utils/metrics.js'

export const metricsRouter = Router()

metricsRouter.get('/metrics', (req: Request, res: Response) => {
  const snap = getMetricsSnapshot()
  const wantsText = req.query.format === 'txt' || (req.headers['accept'] || '').toString().includes('text/plain')
  if (wantsText) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.send(formatMetricsText(snap))
    return
  }
  res.json({ ok: true, data: snap })
})
