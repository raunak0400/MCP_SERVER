import Task, { ITask } from '../models/Task.js'
import { createLogger } from '../utils/logger.js'
import { EventBus } from '../core/eventBus.js'

const logger = createLogger('info')

export interface CreateTaskDTO {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  plugin?: string
  action?: string
  payload?: Record<string, any>
  userId: string
  scheduledAt?: Date
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateTaskDTO {
  title?: string
  description?: string
  status?: 'pending' | 'in-progress' | 'completed' | 'failed'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  result?: Record<string, any>
  error?: string
  tags?: string[]
}

export class TaskService {
  constructor(private events?: EventBus) {}

  async findAll(userId?: string, filters?: any): Promise<ITask[]> {
    try {
      const query: any = {}
      
      if (userId) {
        query.userId = userId
      }
      
      if (filters) {
        if (filters.status) query.status = filters.status
        if (filters.priority) query.priority = filters.priority
        if (filters.plugin) query.plugin = filters.plugin
        if (filters.tags) query.tags = { $in: filters.tags }
      }

      return await Task.find(query).sort({ createdAt: -1 }).limit(100)
    } catch (error: any) {
      logger.error('Error finding tasks:', error.message)
      throw new Error('Failed to find tasks')
    }
  }

  async findById(id: string): Promise<ITask | null> {
    try {
      return await Task.findById(id).populate('userId', 'username email')
    } catch (error: any) {
      logger.error('Error finding task by ID:', error.message)
      throw new Error('Failed to find task')
    }
  }

  async create(data: CreateTaskDTO): Promise<ITask> {
    try {
      const task = new Task({
        title: data.title,
        description: data.description,
        priority: data.priority || 'medium',
        plugin: data.plugin,
        action: data.action,
        payload: data.payload,
        userId: data.userId,
        scheduledAt: data.scheduledAt,
        tags: data.tags || [],
        metadata: data.metadata,
        status: 'pending'
      })

      await task.save()
      logger.info(`Task created: ${task.id}`)
      
      if (this.events) {
        this.events.emit('taskCreated', { taskId: task.id, task })
      }
      
      return task
    } catch (error: any) {
      logger.error('Error creating task:', error.message)
      throw error
    }
  }

  async update(id: string, data: UpdateTaskDTO): Promise<ITask | null> {
    try {
      const task = await Task.findById(id)
      if (!task) {
        throw new Error('Task not found')
      }

      if (data.title) task.title = data.title
      if (data.description !== undefined) task.description = data.description
      if (data.status) {
        task.status = data.status
        
        if (data.status === 'in-progress' && !task.startedAt) {
          task.startedAt = new Date()
        }
        
        if ((data.status === 'completed' || data.status === 'failed') && !task.completedAt) {
          task.completedAt = new Date()
        }
      }
      if (data.priority) task.priority = data.priority
      if (data.result) task.result = data.result
      if (data.error) task.error = data.error
      if (data.tags) task.tags = data.tags

      await task.save()
      logger.info(`Task updated: ${task.id}`)
      
      if (this.events) {
        this.events.emit('taskUpdated', { taskId: task.id, task })
      }
      
      return task
    } catch (error: any) {
      logger.error('Error updating task:', error.message)
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await Task.findByIdAndDelete(id)
      if (result) {
        logger.info(`Task deleted: ${id}`)
        
        if (this.events) {
          this.events.emit('taskDeleted', { taskId: id })
        }
        
        return true
      }
      return false
    } catch (error: any) {
      logger.error('Error deleting task:', error.message)
      throw new Error('Failed to delete task')
    }
  }

  async executeTask(taskId: string, pluginService: any): Promise<ITask> {
    try {
      const task = await Task.findById(taskId)
      if (!task) {
        throw new Error('Task not found')
      }

      if (!task.plugin || !task.action) {
        throw new Error('Task missing plugin or action')
      }

      // Update task status
      task.status = 'in-progress'
      task.startedAt = new Date()
      await task.save()

      try {
        // Execute plugin
        const result = await pluginService.execute(task.plugin, task.action, task.payload)
        
        // Update task with result
        task.status = 'completed'
        task.result = result
        task.completedAt = new Date()
        await task.save()
        
        logger.info(`Task executed successfully: ${taskId}`)
        
        if (this.events) {
          this.events.emit('taskCompleted', { taskId, task })
        }
        
        return task
      } catch (execError: any) {
        // Update task with error
        task.status = 'failed'
        task.error = execError.message
        task.completedAt = new Date()
        task.retryCount += 1
        await task.save()
        
        logger.error(`Task execution failed: ${taskId}`, execError.message)
        
        if (this.events) {
          this.events.emit('taskFailed', { taskId, task, error: execError.message })
        }
        
        // Retry if under max retries
        if (task.retryCount < task.maxRetries) {
          logger.info(`Scheduling task retry: ${taskId} (attempt ${task.retryCount + 1})`)
          task.status = 'pending'
          task.scheduledAt = new Date(Date.now() + 60000) // Retry in 1 minute
          await task.save()
        }
        
        throw execError
      }
    } catch (error: any) {
      logger.error('Error executing task:', error.message)
      throw error
    }
  }

  async getScheduledTasks(): Promise<ITask[]> {
    try {
      const now = new Date()
      return await Task.find({
        status: 'pending',
        scheduledAt: { $lte: now }
      }).sort({ priority: -1, scheduledAt: 1 }).limit(50)
    } catch (error: any) {
      logger.error('Error getting scheduled tasks:', error.message)
      return []
    }
  }

  async getStats(userId?: string): Promise<any> {
    try {
      const query: any = userId ? { userId } : {}
      
      const [total, byStatus, byPriority] = await Promise.all([
        Task.countDocuments(query),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Task.aggregate([
          { $match: query },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ])
      ])

      return {
        total,
        byStatus: byStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        byPriority: byPriority.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {})
      }
    } catch (error: any) {
      logger.error('Error getting task stats:', error.message)
      return null
    }
  }

  async cleanup(olderThanDays = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
      
      const result = await Task.deleteMany({
        status: { $in: ['completed', 'failed'] },
        completedAt: { $lt: cutoffDate }
      })
      
      logger.info(`Cleaned up ${result.deletedCount} old tasks`)
      return result.deletedCount || 0
    } catch (error: any) {
      logger.error('Error cleaning up tasks:', error.message)
      return 0
    }
  }
}
