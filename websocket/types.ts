export interface WebSocketMessage {
  type: string
  payload?: unknown
  timestamp: number
}

export interface ClientConnection {
  id: string
  socket: any
  connectedAt: Date
  lastActivity: Date
  metadata?: Record<string, unknown>
}

export interface WebSocketEvent {
  event: string
  data: unknown
}

export enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  BROADCAST = 'broadcast',
  ERROR = 'error'
}
