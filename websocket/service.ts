import { WebSocketServer, WebSocket } from 'ws'
import { Server as HttpServer } from 'http'
import { ConnectionManager } from './connectionManager.js'
import { MessageHandler } from './messageHandler.js'
import { Logger } from '../src/utils/logger.js'
import { EventBus } from '../src/core/eventBus.js'
import { v4 as uuidv4 } from 'uuid'

export class WebSocketService {
  private wss: WebSocketServer
  private connectionManager: ConnectionManager
  private messageHandler: MessageHandler
  private pingInterval: NodeJS.Timeout | null = null

  constructor(
    private server: HttpServer,
    private logger: Logger,
    private events: EventBus
  ) {
    this.wss = new WebSocketServer({ server })
    this.connectionManager = new ConnectionManager(logger)
    this.messageHandler = new MessageHandler()
    this.setupEventListeners()
    this.startPingInterval()
  }

  private setupEventListeners(): void {
    this.wss.on('connection', (socket: WebSocket, request) => {
      const clientId = uuidv4()
      this.handleConnection(socket, clientId, request)
    })

    this.wss.on('error', (error) => {
      this.logger.error(`WebSocket server error: ${error.message}`)
    })

    this.events.on('pluginLoaded', (name: string) => {
      this.broadcast({ type: 'pluginLoaded', name, timestamp: Date.now() })
    })

    this.events.on('pluginExecuted', (name: string, action: string) => {
      this.broadcast({ type: 'pluginExecuted', name, action, timestamp: Date.now() })
    })

    this.events.on('started', () => {
      this.broadcast({ type: 'started', timestamp: Date.now() })
    })
  }

  private handleConnection(socket: WebSocket, clientId: string, request: any): void {
    const metadata = {
      userAgent: request.headers['user-agent'],
      origin: request.headers.origin,
      ip: request.socket.remoteAddress
    }

    this.connectionManager.addConnection(clientId, socket, metadata)
    this.logger.info(`WebSocket connection established: ${clientId}`)

    socket.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: Date.now()
    }))

    socket.on('message', async (data: Buffer) => {
      await this.handleMessage(socket, clientId, data.toString())
    })

    socket.on('close', () => {
      this.handleDisconnection(clientId)
    })

    socket.on('error', (error) => {
      this.logger.error(`WebSocket error for client ${clientId}: ${error.message}`)
      this.handleDisconnection(clientId)
    })

    socket.on('pong', () => {
      this.connectionManager.updateActivity(clientId)
    })
  }

  private async handleMessage(socket: WebSocket, clientId: string, data: string): Promise<void> {
    this.connectionManager.updateActivity(clientId)

    const message = this.messageHandler.parseMessage(data)
    if (!message) {
      socket.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Invalid message format' },
        timestamp: Date.now()
      }))
      return
    }

    const response = await this.messageHandler.handleMessage(message, clientId)
    if (response) {
      socket.send(this.messageHandler.serializeMessage(response))
    }
  }

  private handleDisconnection(clientId: string): void {
    this.connectionManager.removeConnection(clientId)
    this.logger.info(`WebSocket disconnected: ${clientId}`)
  }

  broadcast(data: unknown): void {
    const message = typeof data === 'string' ? data : JSON.stringify(data)
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  broadcastToRoom(room: string, data: unknown): void {
    const clientIds = this.connectionManager.getRoomClients(room)
    const message = typeof data === 'string' ? data : JSON.stringify(data)

    clientIds.forEach(clientId => {
      const connection = this.connectionManager.getConnection(clientId)
      if (connection && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(message)
      }
    })
  }

  sendToClient(clientId: string, data: unknown): void {
    const connection = this.connectionManager.getConnection(clientId)
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data)
      connection.socket.send(message)
    }
  }

  getStats() {
    return {
      totalConnections: this.connectionManager.getConnectionCount(),
      connections: this.connectionManager.getAllConnections().map(c => ({
        id: c.id,
        connectedAt: c.connectedAt,
        lastActivity: c.lastActivity,
        metadata: c.metadata
      }))
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping()
        }
      })
      this.connectionManager.cleanup()
    }, 30000)
  }

  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    this.wss.close()
    this.logger.info('WebSocket server shut down')
  }
}
