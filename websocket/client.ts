import { WebSocket } from 'ws'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)

      this.ws.on('open', () => {
        console.log('Connected to WebSocket server')
        this.reconnectAttempts = 0
        resolve()
      })

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data.toString())
      })

      this.ws.on('close', () => {
        console.log('Disconnected from WebSocket server')
        this.handleReconnect()
      })

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      })
    })
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)
      console.log('Received:', message)
    } catch (error) {
      console.error('Failed to parse message:', error)
    }
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
      setTimeout(() => {
        this.connect().catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
