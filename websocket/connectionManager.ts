import { WebSocket } from 'ws'
import { ClientConnection } from './types.js'
import { Logger } from '../src/utils/logger.js'

export class ConnectionManager {
  private connections: Map<string, ClientConnection> = new Map()
  private rooms: Map<string, Set<string>> = new Map()

  constructor(private logger: Logger) {}

  addConnection(id: string, socket: WebSocket, metadata?: Record<string, unknown>): void {
    const connection: ClientConnection = {
      id,
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
      metadata
    }
    this.connections.set(id, connection)
    this.logger.info(`Client connected: ${id}`)
  }

  removeConnection(id: string): void {
    this.connections.delete(id)
    this.rooms.forEach(room => room.delete(id))
    this.logger.info(`Client disconnected: ${id}`)
  }

  getConnection(id: string): ClientConnection | undefined {
    return this.connections.get(id)
  }

  getAllConnections(): ClientConnection[] {
    return Array.from(this.connections.values())
  }

  getConnectionCount(): number {
    return this.connections.size
  }

  updateActivity(id: string): void {
    const connection = this.connections.get(id)
    if (connection) {
      connection.lastActivity = new Date()
    }
  }

  joinRoom(clientId: string, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set())
    }
    this.rooms.get(room)?.add(clientId)
    this.logger.info(`Client ${clientId} joined room: ${room}`)
  }

  leaveRoom(clientId: string, room: string): void {
    this.rooms.get(room)?.delete(clientId)
    if (this.rooms.get(room)?.size === 0) {
      this.rooms.delete(room)
    }
    this.logger.info(`Client ${clientId} left room: ${room}`)
  }

  getRoomClients(room: string): string[] {
    return Array.from(this.rooms.get(room) || [])
  }

  cleanup(): void {
    const now = Date.now()
    const timeout = 5 * 60 * 1000
    
    this.connections.forEach((connection, id) => {
      const inactive = now - connection.lastActivity.getTime()
      if (inactive > timeout) {
        this.removeConnection(id)
      }
    })
  }
}
