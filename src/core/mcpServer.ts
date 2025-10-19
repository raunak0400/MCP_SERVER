import { PluginService } from '../services/pluginService.js'
import { EventBus } from './eventBus.js'

export class McpServer {
  constructor(private plugins: PluginService, private events: EventBus) {}
  async execute(plugin: string, action: string, payload: unknown) {
    const result = await this.plugins.execute(plugin, action, payload)
    return result
  }
}
