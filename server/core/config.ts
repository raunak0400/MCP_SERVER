export const SERVER_PORT = Number(process.env.PORT ?? 3333)
export const NODE_ENV = process.env.NODE_ENV ?? 'development'

export function isProduction() {
  return NODE_ENV === 'production'
}
