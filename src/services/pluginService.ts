import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { spawn } from 'child_process'
import { EventBus } from '../core/eventBus.js'
import { Logger } from '../utils/logger.js'
import { ExternalPluginDescriptor, Plugin, PluginContext } from '../types/index.js'

export class PluginService {
  private plugins = new Map<string, Plugin>()
  private externals = new Map<string, ExternalPluginDescriptor>()
  constructor(private logger: Logger, private events: EventBus) {}
  async loadAll(baseDir?: string) {
    const root = baseDir || path.join(path.dirname(new URL(import.meta.url).pathname), '..')
    const internalDir = path.join(root, 'plugins')
    const manifest = path.join(internalDir, 'manifest.json')
    await this.loadInternal(internalDir)
    await this.loadExternal(manifest)
  }
  private async loadInternal(dir: string) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir)
    for (const name of entries) {
      const full = path.join(dir, name)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        await this.loadInternal(full)
  } else if (stat.isFile() && (name.endsWith('.js') || name.endsWith('.mjs') || name.endsWith('.ts'))) {
        const mod = await import(pathToFileURL(full).href)
        const plugin: Plugin | undefined = mod.default
        if (plugin && plugin.name) this.register(plugin)
      }
    }
  }
  private async loadExternal(manifestPath: string) {
    if (!fs.existsSync(manifestPath)) return
    const raw = fs.readFileSync(manifestPath, 'utf-8')
    const list: ExternalPluginDescriptor[] = JSON.parse(raw)
    for (const d of list) this.externals.set(d.name, d)
    for (const d of list) this.events.emit('pluginLoaded', d.name)
  }
  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin)
    this.events.emit('pluginLoaded', plugin.name)
    this.logger.info(`plugin registered ${plugin.name}`)
  }
  async execute(pluginName: string, action: string, payload: unknown) {
    const internal = this.plugins.get(pluginName)
    if (internal) {
      const ctx: PluginContext = { emit: (event, data) => this.events.emit('pluginExecuted', pluginName, event) }
      const fn = internal.actions[action]
      if (!fn) throw new Error('action not found')
      const res = await Promise.resolve(fn(payload, ctx))
      this.events.emit('pluginExecuted', pluginName, action)
      return res
    }
    const external = this.externals.get(pluginName)
    if (external) {
      return await this.executeExternal(external, payload)
    }
    throw new Error('plugin not found')
  }
  private async executeExternal(desc: ExternalPluginDescriptor, payload: unknown) {
    return await new Promise((resolve, reject) => {
      const proc = spawn(desc.command, [...(desc.args || []), JSON.stringify(payload || {})], { cwd: desc.cwd || process.cwd(), shell: false })
      const chunks: Buffer[] = []
      const errChunks: Buffer[] = []
      proc.stdout.on('data', d => chunks.push(Buffer.from(d)))
      proc.stderr.on('data', d => errChunks.push(Buffer.from(d)))
      proc.on('error', reject)
      proc.on('close', code => {
        if (code === 0) {
          const out = Buffer.concat(chunks).toString('utf8').trim()
          try {
            resolve(JSON.parse(out))
          } catch {
            resolve(out)
          }
        } else {
          reject(new Error(Buffer.concat(errChunks).toString('utf8') || 'external plugin failed'))
        }
      })
    })
  }
}
