import { WebSocketServer } from 'ws'
import type http from 'http'
import { EventBus } from '../core/eventBus.js'

export const createWsHandler = (server: http.Server, events: EventBus) => {
  const wss = new WebSocketServer({ server })
  events.on('pluginLoaded', (name: string) => {
    const data = JSON.stringify({ type: 'pluginLoaded', name })
    wss.clients.forEach((c: any) => c.send(data))
  })
  events.on('pluginExecuted', (name: string, action: string) => {
    const data = JSON.stringify({ type: 'pluginExecuted', name, action })
    wss.clients.forEach((c: any) => c.send(data))
  })
  events.on('started', () => {
    const data = JSON.stringify({ type: 'started' })
    wss.clients.forEach((c: any) => c.send(data))
  })
  return wss
}
