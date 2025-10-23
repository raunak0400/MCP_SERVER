import type { NextFunction, Request, Response } from 'express'

export type RateLimitKey = 'ip' | 'ipRoute'

export type RateLimitOptions = {
  capacity?: number // max tokens in the bucket
  refillPerSec?: number // tokens added per second
  key?: RateLimitKey // keying strategy
  statusCode?: number // status returned when limited
  message?: string // message body when limited
}

type Bucket = {
  tokens: number
  lastRefillMs: number
}

// A simple in-memory token bucket rate limiter suitable for single-instance deployments.
// For distributed environments, use Redis or another centralized store.
export const rateLimit = (opts: RateLimitOptions = {}) => {
  const capacity = Math.max(1, opts.capacity ?? 60)
  const refillPerSec = Math.max(0.001, opts.refillPerSec ?? 1)
  const keyMode: RateLimitKey = opts.key ?? 'ip'
  const statusCode = opts.statusCode ?? 429
  const message = opts.message ?? 'rate_limited'

  const buckets = new Map<string, Bucket>()

  const getKey = (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    if (keyMode === 'ipRoute') {
      const route = req.route?.path || req.path || 'unknown'
      return `${ip} ${req.method.toUpperCase()} ${route}`
    }
    return String(ip)
  }

  const refill = (bucket: Bucket, nowMs: number) => {
    const elapsedSec = (nowMs - bucket.lastRefillMs) / 1000
    if (elapsedSec <= 0) return
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec)
    bucket.lastRefillMs = nowMs
  }

  const ensureBucket = (key: string, nowMs: number) => {
    let b = buckets.get(key)
    if (!b) {
      b = { tokens: capacity, lastRefillMs: nowMs }
      buckets.set(key, b)
    }
    return b
  }

  const secondsUntilNextToken = (bucket: Bucket) => {
    if (bucket.tokens >= 1) return 0
    const deficit = 1 - bucket.tokens
    return Math.ceil(deficit / refillPerSec)
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const key = getKey(req)
    const bucket = ensureBucket(key, now)
    refill(bucket, now)

    const remainingBefore = Math.floor(Math.max(0, bucket.tokens))
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      const remainingAfter = Math.floor(Math.max(0, bucket.tokens))
      // Set informational headers (IETF draft and popular variants)
      res.setHeader('RateLimit-Limit', String(capacity))
      res.setHeader('RateLimit-Remaining', String(remainingAfter))
      res.setHeader('X-RateLimit-Limit', String(capacity))
      res.setHeader('X-RateLimit-Remaining', String(remainingAfter))
      return next()
    }

    const retryAfter = secondsUntilNextToken(bucket)
    res.setHeader('Retry-After', String(retryAfter))
    res.setHeader('RateLimit-Limit', String(capacity))
    res.setHeader('RateLimit-Remaining', String(remainingBefore))
    res.setHeader('X-RateLimit-Limit', String(capacity))
    res.setHeader('X-RateLimit-Remaining', String(remainingBefore))

    res.status(statusCode).json({ ok: false, error: message })
  }
}
