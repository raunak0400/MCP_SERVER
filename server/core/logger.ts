import winston from 'winston'

export function createServerLogger(moduleName = 'server') {
  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: moduleName },
    transports: [new winston.transports.Console()],
  })
}

export const logger = createServerLogger()
