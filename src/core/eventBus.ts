import { EventEmitter } from 'events'

type Events = {
  started: []
  pluginLoaded: [string]
  pluginExecuted: [string, string]
  // Task lifecycle events
  taskCreated: [any]
  taskUpdated: [any]
  taskDeleted: [any]
  taskCompleted: [any]
  taskFailed: [any]
}

export class EventBus {
  private emitter = new EventEmitter()
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void) {
    this.emitter.on(event as string, listener as (...args: any[]) => void)
  }
  emit<K extends keyof Events>(event: K, ...args: Events[K]) {
    this.emitter.emit(event as string, ...args)
  }
}
