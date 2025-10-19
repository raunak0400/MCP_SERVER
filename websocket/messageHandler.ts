import { WebSocketMessage, MessageType } from './types.js'

export class MessageHandler {
  async handleMessage(message: WebSocketMessage, clientId: string): Promise<WebSocketMessage | null> {
    switch (message.type) {
      case MessageType.PING:
        return this.handlePing()
      case MessageType.SUBSCRIBE:
        return this.handleSubscribe(message, clientId)
      case MessageType.UNSUBSCRIBE:
        return this.handleUnsubscribe(message, clientId)
      default:
        return null
    }
  }

  private handlePing(): WebSocketMessage {
    return {
      type: MessageType.PONG,
      timestamp: Date.now()
    }
  }

  private handleSubscribe(message: WebSocketMessage, clientId: string): WebSocketMessage {
    return {
      type: 'subscribed',
      payload: message.payload,
      timestamp: Date.now()
    }
  }

  private handleUnsubscribe(message: WebSocketMessage, clientId: string): WebSocketMessage {
    return {
      type: 'unsubscribed',
      payload: message.payload,
      timestamp: Date.now()
    }
  }

  createMessage(type: string, payload?: unknown): WebSocketMessage {
    return {
      type,
      payload,
      timestamp: Date.now()
    }
  }

  parseMessage(data: string): WebSocketMessage | null {
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  serializeMessage(message: WebSocketMessage): string {
    return JSON.stringify(message)
  }
}
