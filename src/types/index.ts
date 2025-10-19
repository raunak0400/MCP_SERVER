export type PluginContext = {
  emit: (event: string, data?: unknown) => void
}

export type Plugin = {
  name: string
  actions: Record<string, (payload: unknown, ctx: PluginContext) => Promise<unknown> | unknown>
}

export type ExternalPluginDescriptor = {
  name: string
  command: string
  args?: string[]
  cwd?: string
}

export type McpExecuteRequest = {
  plugin: string
  action: string
  payload?: unknown
}

export type McpExecuteResponse = {
  ok: boolean
  result?: unknown
  error?: string
}
