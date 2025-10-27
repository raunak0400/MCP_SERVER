import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserService } from '../services/userService.js'

const userService = new UserService()

export interface AuthRequest extends Request {
  user?: any
  userId?: string
}

// Verify JWT token
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      res.status(401).json({ ok: false, error: 'No token provided' })
      return
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key'
    const decoded: any = jwt.verify(token, secret)
    
    const user = await userService.findById(decoded.userId)
    
    if (!user || !user.isActive) {
      res.status(401).json({ ok: false, error: 'Invalid token or user inactive' })
      return
    }

    req.user = user
    req.userId = user.id
    next()
  } catch (error: any) {
    res.status(401).json({ ok: false, error: 'Invalid token' })
  }
}

// Verify API Key
export const verifyApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string
    
    if (!apiKey) {
      res.status(401).json({ ok: false, error: 'No API key provided' })
      return
    }

    const user = await userService.findByApiKey(apiKey)
    
    if (!user || !user.isActive) {
      res.status(401).json({ ok: false, error: 'Invalid API key' })
      return
    }

    req.user = user
    req.userId = user.id
    next()
  } catch (error: any) {
    res.status(401).json({ ok: false, error: 'Invalid API key' })
  }
}

// Verify either JWT or API Key
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const apiKey = req.headers['x-api-key'] as string

  if (token) {
    return verifyToken(req, res, next)
  } else if (apiKey) {
    return verifyApiKey(req, res, next)
  } else {
    res.status(401).json({ ok: false, error: 'No authentication provided' })
  }
}

// Check if user has required role
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ ok: false, error: 'Not authenticated' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ ok: false, error: 'Insufficient permissions' })
      return
    }

    next()
  }
}

// Optional authentication (doesn't fail if no auth)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const apiKey = req.headers['x-api-key'] as string

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key'
      const decoded: any = jwt.verify(token, secret)
      const user = await userService.findById(decoded.userId)
      
      if (user && user.isActive) {
        req.user = user
        req.userId = user.id
      }
    } catch (error) {
      // Ignore errors, continue without auth
    }
  } else if (apiKey) {
    try {
      const user = await userService.findByApiKey(apiKey)
      if (user && user.isActive) {
        req.user = user
        req.userId = user.id
      }
    } catch (error) {
      // Ignore errors, continue without auth
    }
  }

  next()
}

// Legacy middleware for backward compatibility
export const authMiddleware = authenticate
