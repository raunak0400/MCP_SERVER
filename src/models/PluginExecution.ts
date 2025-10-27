import mongoose, { Schema, Document } from 'mongoose'

export interface IPluginExecution extends Document {
  plugin: string
  action: string
  payload: Record<string, any>
  result?: Record<string, any>
  error?: string
  status: 'success' | 'failure'
  duration: number
  userId?: mongoose.Types.ObjectId
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  createdAt: Date
}

const PluginExecutionSchema = new Schema<IPluginExecution>({
  plugin: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  result: {
    type: Schema.Types.Mixed
  },
  error: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
    index: true
  },
  duration: {
    type: Number,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Indexes for analytics
PluginExecutionSchema.index({ plugin: 1, createdAt: -1 })
PluginExecutionSchema.index({ status: 1, createdAt: -1 })
PluginExecutionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model<IPluginExecution>('PluginExecution', PluginExecutionSchema)
