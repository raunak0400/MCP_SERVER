import mongoose, { Schema, Document } from 'mongoose'

export interface ITask extends Document {
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  plugin?: string
  action?: string
  payload?: Record<string, any>
  result?: Record<string, any>
  error?: string
  userId: mongoose.Types.ObjectId
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  retryCount: number
  maxRetries: number
  tags: string[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  plugin: {
    type: String,
    trim: true
  },
  action: {
    type: String,
    trim: true
  },
  payload: {
    type: Schema.Types.Mixed
  },
  result: {
    type: Schema.Types.Mixed
  },
  error: {
    type: String
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scheduledAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Indexes for better query performance
TaskSchema.index({ userId: 1, status: 1 })
TaskSchema.index({ createdAt: -1 })
TaskSchema.index({ scheduledAt: 1 })
TaskSchema.index({ tags: 1 })

export default mongoose.model<ITask>('Task', TaskSchema)
