import { Request, Response } from 'express'
import { TaskService } from '../services/taskService.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('info')
const taskService = new TaskService()

export class TaskController {
  async list(req: Request, res: Response) {
    try {
      const userId = (req as any).userId
      const filters = req.query || {}
      const tasks = await taskService.findAll(userId, filters)
      res.json({ ok: true, data: tasks })
    } catch (error: any) {
      logger.error('Error listing tasks:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to list tasks' })
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId
      const payload = req.body
      const data = Object.assign({}, payload, { userId })
      const task = await taskService.create(data)
      res.status(201).json({ ok: true, data: task })
    } catch (error: any) {
      logger.error('Error creating task:', error.message)
      res.status(400).json({ ok: false, error: error.message })
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId
      const stats = await taskService.getStats(userId)
      res.json({ ok: true, data: stats })
    } catch (error: any) {
      logger.error('Error getting task stats:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to get stats' })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id
      const task = await taskService.findById(id)
      if (!task) return res.status(404).json({ ok: false, error: 'Task not found' })
      res.json({ ok: true, data: task })
    } catch (error: any) {
      logger.error('Error getting task by id:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to get task' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id
      const data = req.body
      const updated = await taskService.update(id, data)
      res.json({ ok: true, data: updated })
    } catch (error: any) {
      logger.error('Error updating task:', error.message)
      res.status(400).json({ ok: false, error: error.message })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id
      const ok = await taskService.delete(id)
      res.json({ ok: true, data: { deleted: ok } })
    } catch (error: any) {
      logger.error('Error deleting task:', error.message)
      res.status(500).json({ ok: false, error: 'Failed to delete task' })
    }
  }

  async execute(req: Request, res: Response) {
    try {
      const id = req.params.id
      // pluginService will need to be passed - use a minimal placeholder if not available
      const pluginService = (req as any).pluginService || null
      const task = await taskService.executeTask(id, pluginService)
      res.json({ ok: true, data: task })
    } catch (error: any) {
      logger.error('Error executing task:', error.message)
      res.status(500).json({ ok: false, error: error.message })
    }
  }
}
