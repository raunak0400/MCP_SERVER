import { Request, Response, NextFunction } from 'express'

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500
  const message = typeof err.message === 'string' ? err.message : 'internal_error'
  res.status(status).json({ ok: false, error: message })
}
