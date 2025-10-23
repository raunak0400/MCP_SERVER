import os from 'os'
import process from 'process'
import type { Request, Response, NextFunction } from 'express'

type Counter = number
type Histogram = number[]
type RouteKey = string // method path, e.g. GET /health

export type MetricsSnapshot = {
  timestamp: string
  process: {
    pid: number
    nodeVersion: string
    uptimeSec: number
    rssBytes: number
    heapUsedBytes: number
    heapTotalBytes: number
    externalBytes: number
    eventLoopLagMsAvg: number
    cpuLoadAvg: number[]
  }
  system: {
    hostname: string
    platform: NodeJS.Platform
    arch: string
    totalMemBytes: number
    freeMemBytes: number
  }
  requests: {
    total: Counter
    inFlight: Counter
    byRoute: Record<RouteKey, { count: Counter; errors: Counter; avgMs: number; p95Ms: number }>
    statuses: Record<string, Counter>
  }
}

// Internal mutable state kept intentionally simple and lock-free.
const state = {
  totalRequests: 0 as Counter,
  inFlight: 0 as Counter,
  byRoute: new Map<RouteKey, { count: Counter; errors: Counter; durations: Histogram }>(),
  statuses: new Map<number, Counter>(),
  // Exponentially weighted moving average of event loop lag
  eventLoopLagMsEwma: 0,
}

let lagTimer: NodeJS.Timeout | null = null

export const initMetrics = () => {
  if (!lagTimer) startEventLoopLagMonitor()
}

export const startEventLoopLagMonitor = (intervalMs = 500) => {
  if (lagTimer) return
  let expected = Date.now() + intervalMs
  lagTimer = setInterval(() => {
    const now = Date.now()
    const lag = Math.max(0, now - expected)
    // EWMA with smoothing factor alpha
    const alpha = 0.2
    state.eventLoopLagMsEwma = alpha * lag + (1 - alpha) * state.eventLoopLagMsEwma
    expected = now + intervalMs
  }, intervalMs)
  if (lagTimer.unref) lagTimer.unref()
}

const ensureRoute = (key: RouteKey) => {
  if (!state.byRoute.has(key)) state.byRoute.set(key, { count: 0, errors: 0, durations: [] })
  return state.byRoute.get(key)!
}

export const recordRequestStart = (method: string, path: string) => {
  state.totalRequests++
  state.inFlight++
  const key = `${method.toUpperCase()} ${path}`
  ensureRoute(key)
}

export const recordRequestEnd = (method: string, path: string, status: number, durationMs: number) => {
  state.inFlight = Math.max(0, state.inFlight - 1)
  const key = `${method.toUpperCase()} ${path}`
  const r = ensureRoute(key)
  r.count++
  if (status >= 400) r.errors++
  // cap histogram length to avoid unbounded memory usage
  if (r.durations.length > 5000) r.durations.shift()
  r.durations.push(durationMs)
  state.statuses.set(status, (state.statuses.get(status) || 0) + 1)
}

const average = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
const percentile = (arr: number[], p: number) => {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)))
  return sorted[idx]
}

export const getMetricsSnapshot = (): MetricsSnapshot => {
  const mem = process.memoryUsage()
  const byRoute: MetricsSnapshot['requests']['byRoute'] = {}
  for (const [k, v] of state.byRoute) {
    byRoute[k] = {
      count: v.count,
      errors: v.errors,
      avgMs: Math.round(average(v.durations)),
      p95Ms: Math.round(percentile(v.durations, 95)),
    }
  }
  const statuses: Record<string, number> = {}
  for (const [code, cnt] of state.statuses) statuses[String(code)] = cnt

  return {
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      uptimeSec: Math.round(process.uptime()),
      rssBytes: mem.rss,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      externalBytes: mem.external ?? 0,
      eventLoopLagMsAvg: Math.round(state.eventLoopLagMsEwma),
      cpuLoadAvg: os.loadavg?.() || [0, 0, 0],
    },
    system: {
      hostname: os.hostname(),
      platform: process.platform,
      arch: process.arch,
      totalMemBytes: os.totalmem(),
      freeMemBytes: os.freemem(),
    },
    requests: {
      total: state.totalRequests,
      inFlight: state.inFlight,
      byRoute,
      statuses,
    },
  }
}

// Express middleware for convenience (optional to use)
export const requestMetrics = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint()
    const path = req.route?.path || req.path || 'unknown'
    recordRequestStart(req.method, path)
    res.on('finish', () => {
      const end = process.hrtime.bigint()
      const ms = Number(end - start) / 1e6
      recordRequestEnd(req.method, path, res.statusCode, ms)
    })
    next()
  }
}

// Text format for quick curl checks
export const formatMetricsText = (snap: MetricsSnapshot) => {
  const lines: string[] = []
  lines.push(`# metrics at ${snap.timestamp}`)
  lines.push(`process_uptime_seconds ${snap.process.uptimeSec}`)
  lines.push(`process_memory_rss_bytes ${snap.process.rssBytes}`)
  lines.push(`event_loop_lag_ms_avg ${snap.process.eventLoopLagMsAvg}`)
  lines.push(`requests_total ${snap.requests.total}`)
  lines.push(`requests_in_flight ${snap.requests.inFlight}`)
  for (const [code, cnt] of Object.entries(snap.requests.statuses)) lines.push(`requests_status_count{code="${code}"} ${cnt}`)
  for (const [route, v] of Object.entries(snap.requests.byRoute)) {
    lines.push(`route_requests_count{route="${route}"} ${v.count}`)
    lines.push(`route_requests_errors{route="${route}"} ${v.errors}`)
    lines.push(`route_latency_ms_avg{route="${route}"} ${v.avgMs}`)
    lines.push(`route_latency_ms_p95{route="${route}"} ${v.p95Ms}`)
  }
  return lines.join('\n') + '\n'
}
