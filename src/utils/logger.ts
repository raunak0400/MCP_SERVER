import winston from 'winston'
const timestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' })
const printf = winston.format.printf((info: any) => `${String(info.timestamp)} ${String(info.level).toUpperCase()} ${String(info.message)}`)
export const createLogger = (level: string) => winston.createLogger({ level, transports: [new winston.transports.Console({ format: winston.format.combine(timestamp, printf) })] })
export type Logger = winston.Logger
