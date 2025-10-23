export default {
  port: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 4000,
  env: process.env.NODE_ENV || 'development'
}
