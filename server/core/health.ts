import { type Request, type Response } from 'express'
import { logger } from './logger'

export function readinessHandler(_req: Request, res: Response) {
  // keep this lean: readiness should be quick and deterministic
  res.status(204).send()
}

export function livenessHandler(_req: Request, res: Response) {
  res.json({ ok: true })
}

export function pingHandler(_req: Request, res: Response) {
  res.send('pong')
}

export function healthRoutes() {
  return {
    readinessHandler,
    livenessHandler,
    pingHandler,
  }
}
