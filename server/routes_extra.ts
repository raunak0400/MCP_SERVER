import express, { type Request, type Response } from 'express'
const router = express.Router()

// Lightweight ping-pong endpoint used by monitoring systems
router.get('/server/ping', (_req: Request, res: Response) => res.send('pong'))

// Health-check readiness probe (returns 204 when ready)
router.get('/server/readiness', (_req: Request, res: Response) => res.status(204).send())

// Liveness probe (200 when alive)
router.get('/server/liveness', (_req: Request, res: Response) => res.json({ ok: true }))

export default router
