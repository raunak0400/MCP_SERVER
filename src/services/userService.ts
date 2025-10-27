import User, { IUser } from '../models/User.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('info')

export interface CreateUserDTO {
  email: string
  username: string
  password: string
  role?: 'admin' | 'user' | 'developer'
}

export interface UpdateUserDTO {
  email?: string
  username?: string
  password?: string
  role?: 'admin' | 'user' | 'developer'
  isActive?: boolean
}

export class UserService {
  async findById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id)
    } catch (error: any) {
      logger.error('Error finding user by ID:', error.message)
      throw new Error('Failed to find user')
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email: email.toLowerCase() })
    } catch (error: any) {
      logger.error('Error finding user by email:', error.message)
      throw new Error('Failed to find user')
    }
  }

  async findByUsername(username: string): Promise<IUser | null> {
    try {
      return await User.findOne({ username })
    } catch (error: any) {
      logger.error('Error finding user by username:', error.message)
      throw new Error('Failed to find user')
    }
  }

  async findByApiKey(apiKey: string): Promise<IUser | null> {
    try {
      return await User.findOne({ apiKey, isActive: true })
    } catch (error: any) {
      logger.error('Error finding user by API key:', error.message)
      throw new Error('Failed to find user')
    }
  }

  async create(data: CreateUserDTO): Promise<IUser> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: data.email.toLowerCase() },
          { username: data.username }
        ]
      })

      if (existingUser) {
        throw new Error('User with this email or username already exists')
      }

      const user = new User({
        email: data.email.toLowerCase(),
        username: data.username,
        password: data.password,
        role: data.role || 'user'
      })

      await user.save()
      logger.info(`User created: ${user.email}`)
      
      return user
    } catch (error: any) {
      logger.error('Error creating user:', error.message)
      throw error
    }
  }

  async update(id: string, data: UpdateUserDTO): Promise<IUser | null> {
    try {
      const user = await User.findById(id)
      if (!user) {
        throw new Error('User not found')
      }

      if (data.email) user.email = data.email.toLowerCase()
      if (data.username) user.username = data.username
      if (data.password) user.password = data.password
      if (data.role) user.role = data.role
      if (typeof data.isActive === 'boolean') user.isActive = data.isActive

      await user.save()
      logger.info(`User updated: ${user.email}`)
      
      return user
    } catch (error: any) {
      logger.error('Error updating user:', error.message)
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id)
      if (result) {
        logger.info(`User deleted: ${result.email}`)
        return true
      }
      return false
    } catch (error: any) {
      logger.error('Error deleting user:', error.message)
      throw new Error('Failed to delete user')
    }
  }

  async list(page = 1, limit = 20, filters?: any): Promise<{ users: IUser[]; total: number; pages: number }> {
    try {
      const query = filters || {}
      const skip = (page - 1) * limit

      const [users, total] = await Promise.all([
        User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
        User.countDocuments(query)
      ])

      return {
        users,
        total,
        pages: Math.ceil(total / limit)
      }
    } catch (error: any) {
      logger.error('Error listing users:', error.message)
      throw new Error('Failed to list users')
    }
  }

  async generateApiKey(userId: string): Promise<string> {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const apiKey = user.generateApiKey()
      await user.save()
      
      logger.info(`API key generated for user: ${user.email}`)
      return apiKey
    } catch (error: any) {
      logger.error('Error generating API key:', error.message)
      throw error
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, { lastLogin: new Date() })
    } catch (error: any) {
      logger.error('Error updating last login:', error.message)
    }
  }

  async getStats(): Promise<any> {
    try {
      const [total, active, byRole] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      ])

      return {
        total,
        active,
        inactive: total - active,
        byRole: byRole.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {})
      }
    } catch (error: any) {
      logger.error('Error getting user stats:', error.message)
      return null
    }
  }
}
