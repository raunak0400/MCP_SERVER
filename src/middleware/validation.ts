import { ZodSchema } from 'zod'
import { Request, Response, NextFunction } from 'express'

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const data = { body: req.body, params: req.params, query: req.query }
  const r = schema.safeParse(data)
  if (!r.success) {
    res.status(400).json({ ok: false, error: 'validation_error', details: r.error.issues })
    return
  }
  next()
}
