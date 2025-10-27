import { Request, Response } from 'express'
import { UserService } from '../services/userService.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('info')
const userService = new UserService()

export class UserController {
  async list(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) || '1', 10)
      const limit = parseInt((req.query.limit as string) || '20', 10)
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined

      const result = await userService.list(page, limit, filters)
      res.json({ ok: true, data: result })
    } catch (error: any) {
      logger.error('Error listing users:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to list users' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id
      const user = await userService.findById(id)
      if (!user) return res.status(404).json({ ok: false, error: 'User not found' })
      res.json({ ok: true, data: user })
    } catch (error: any) {
      logger.error('Error getting user by id:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to get user' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id
      const data = req.body
      const updated = await userService.update(id, data)
      res.json({ ok: true, data: updated })
    } catch (error: any) {
      logger.error('Error updating user:', error.message)
      res.status(400).json({ ok: false, error: error.message })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id
      const ok = await userService.delete(id)
      res.json({ ok: true, data: { deleted: ok } })
    } catch (error: any) {
      logger.error('Error deleting user:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to delete user' })
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await userService.getStats()
      res.json({ ok: true, data: stats })
    } catch (error: any) {
      logger.error('Error getting stats:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to get stats' })
    }
  }
}
