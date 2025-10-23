import { Router } from 'express'
import fetch from 'node-fetch'
const router = Router()

router.get('/server/metrics-proxy', async (req, res) => {
  try {
    const r = await fetch('http://localhost:3000/metrics')
    const body = await r.text()
    res.setHeader('content-type', r.headers.get('content-type') || 'text/plain')
    res.status(r.status).send(body)
  } catch (e) {
    res.status(502).json({ ok: false, error: 'upstream_unavailable' })
  }
})

export default router
