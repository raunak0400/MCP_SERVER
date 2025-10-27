import mongoose from 'mongoose'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('info')

export class DatabaseService {
  private isConnected = false

  async connect(uri?: string): Promise<boolean> {
    try {
      const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp_server'
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
      })

      this.isConnected = true
      logger.info('✅ MongoDB connected successfully')
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err)
        this.isConnected = false
      })

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected')
        this.isConnected = false
      })

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected')
        this.isConnected = true
      })

      return true
    } catch (error: any) {
      logger.error('Failed to connect to MongoDB:', error.message)
      this.isConnected = false
      return false
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      if (this.isConnected) {
        await mongoose.disconnect()
        this.isConnected = false
        logger.info('MongoDB disconnected gracefully')
      }
      return true
    } catch (error: any) {
      logger.error('Error disconnecting from MongoDB:', error.message)
      return false
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1
  }

  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected' }
      }

      const start = Date.now()
      // mongoose.connection.db may be undefined during shutdown/early startup
      const db = mongoose.connection.db
      if (!db) {
        return { status: 'disconnected' }
      }
      await db.admin().ping()
      const latency = Date.now() - start

      return {
        status: 'connected',
        latency
      }
    } catch (error: any) {
      return {
        status: 'error'
      }
    }
  }

  async createIndexes(): Promise<void> {
    try {
      // Indexes are created automatically by mongoose schemas
      // but we can ensure they're created here
      logger.info('Ensuring database indexes...')
      
  const db2 = mongoose.connection.db
  if (!db2) return
  const collections = await db2.collections()
  for (const collection of collections) {
        // createIndexes has a strict signature in the types — call via any to avoid typing issues
        if ((collection as any).createIndexes) {
          await (collection as any).createIndexes()
        }
      }
      
      logger.info('✅ Database indexes ensured')
    } catch (error: any) {
      logger.error('Error creating indexes:', error.message)
    }
  }
}
