import { createClient } from 'redis'

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

export const connectRedis = async () => {
  await redisClient.connect()
}

export const disconnectRedis = async () => {
  await redisClient.disconnect()
}
