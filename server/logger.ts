import winston from 'winston'

export const createServerLogger = () => {
  const logger = winston.createLogger({
    level: 'info',
    transports: [new winston.transports.Console({ format: winston.format.simple() })]
  })
  return logger
}

export type ServerLogger = ReturnType<typeof createServerLogger>
