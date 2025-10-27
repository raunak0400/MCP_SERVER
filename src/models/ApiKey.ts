import mongoose, { Schema, Document } from 'mongoose'

export interface IApiKey extends Document {
  key: string
  name: string
  userId: mongoose.Types.ObjectId
  scopes: string[]
  isActive: boolean
  expiresAt?: Date
  lastUsedAt?: Date
  usageCount: number
  rateLimit?: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const ApiKeySchema = new Schema<IApiKey>({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scopes: [{
    type: String,
    enum: ['read', 'write', 'execute', 'admin']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  lastUsedAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rateLimit: {
    type: Number
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Check if key is expired
ApiKeySchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false
  return new Date() > this.expiresAt
}

export default mongoose.model<IApiKey>('ApiKey', ApiKeySchema)
