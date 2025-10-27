import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { UserService, CreateUserDTO } from '../services/userService.js'
import { z } from 'zod'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('info')
const userService = new UserService()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  role: z.enum(['admin', 'user', 'developer']).optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export class AuthController {
  // Generate JWT token
  private generateToken(userId: string): string {
    const secret: jwt.Secret = (process.env.JWT_SECRET || 'your-secret-key') as jwt.Secret
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

    return (jwt as any).sign({ userId }, secret, { expiresIn })
  }

  // Generate refresh token
  private generateRefreshToken(userId: string): string {
    const secret: jwt.Secret = (process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret') as jwt.Secret
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d'

    return (jwt as any).sign({ userId }, secret, { expiresIn })
  }

  // Register new user
  async register(req: Request, res: Response) {
    try {
      const validation = registerSchema.safeParse(req.body)
      
      if (!validation.success) {
        res.status(400).json({
          ok: false,
          error: 'Validation failed',
          details: validation.error.issues
        })
        return
      }

      const userData: CreateUserDTO = validation.data

      // Create user
      const user = await userService.create(userData)

      // Generate tokens
      const token = this.generateToken(user._id.toString())
      const refreshToken = this.generateRefreshToken(user._id.toString())

      logger.info(`User registered: ${user.email}`)

      res.status(201).json({
        ok: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role
          },
          token,
          refreshToken
        }
      })
    } catch (error: any) {
      logger.error('Registration error:', error.message)
      res.status(400).json({
        ok: false,
        error: error.message
      })
    }
  }

  // Login user
  async login(req: Request, res: Response) {
    try {
      const validation = loginSchema.safeParse(req.body)
      
      if (!validation.success) {
        res.status(400).json({
          ok: false,
          error: 'Validation failed',
          details: validation.error.issues
        })
        return
      }

      const { email, password } = validation.data

      // Find user
      const user = await userService.findByEmail(email)
      
      if (!user) {
        res.status(401).json({
          ok: false,
          error: 'Invalid credentials'
        })
        return
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(403).json({
          ok: false,
          error: 'Account is inactive'
        })
        return
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password)
      
      if (!isValidPassword) {
        res.status(401).json({
          ok: false,
          error: 'Invalid credentials'
        })
        return
      }

      // Update last login
      await userService.updateLastLogin(user._id.toString())

      // Generate tokens
      const token = this.generateToken(user._id.toString())
      const refreshToken = this.generateRefreshToken(user._id.toString())

      logger.info(`User logged in: ${user.email}`)

      res.json({
        ok: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role
          },
          token,
          refreshToken
        }
      })
    } catch (error: any) {
      logger.error('Login error:', error.message)
      res.status(500).json({
        ok: false,
        error: 'Internal server error'
      })
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body
      
      if (!refreshToken) {
        res.status(400).json({
          ok: false,
          error: 'Refresh token required'
        })
        return
      }

      const secret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret'
  const decoded: any = (jwt as any).verify(refreshToken, secret)

      // Verify user still exists and is active
      const user = await userService.findById(decoded.userId)
      
      if (!user || !user.isActive) {
        res.status(401).json({
          ok: false,
          error: 'Invalid refresh token'
        })
        return
      }

      // Generate new tokens
      const newToken = this.generateToken(user._id.toString())
      const newRefreshToken = this.generateRefreshToken(user._id.toString())

      res.json({
        ok: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      })
    } catch (error: any) {
      logger.error('Refresh token error:', error.message)
      res.status(401).json({
        ok: false,
        error: 'Invalid refresh token'
      })
    }
  }

  // Get current user profile
  async getProfile(req: any, res: Response) {
    try {
      const userId = req.userId
      
      if (!userId) {
        res.status(401).json({
          ok: false,
          error: 'Not authenticated'
        })
        return
      }

      const user = await userService.findById(userId)
      
      if (!user) {
        res.status(404).json({
          ok: false,
          error: 'User not found'
        })
        return
      }

      res.json({
        ok: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          }
        }
      })
    } catch (error: any) {
      logger.error('Get profile error:', error.message)
      res.status(500).json({
        ok: false,
        error: 'Internal server error'
      })
    }
  }

  // Generate API key for user
  async generateApiKey(req: any, res: Response) {
    try {
      const userId = req.userId
      
      if (!userId) {
        res.status(401).json({
          ok: false,
          error: 'Not authenticated'
        })
        return
      }

      const apiKey = await userService.generateApiKey(userId)

      logger.info(`API key generated for user: ${userId}`)

      res.json({
        ok: true,
        data: {
          apiKey
        }
      })
    } catch (error: any) {
      logger.error('Generate API key error:', error.message)
      res.status(500).json({
        ok: false,
        error: 'Internal server error'
      })
    }
  }
}
