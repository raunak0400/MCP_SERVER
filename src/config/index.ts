import dotenv from 'dotenv'

const env = process.env.NODE_ENV || 'development'
if (process.env.LOAD_ENV !== 'false') dotenv.config()

export const config = {
  env,
  isProd: env === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info'
}

export default config
