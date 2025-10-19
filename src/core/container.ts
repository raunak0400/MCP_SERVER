type Token<T> = string

export class Container {
  private instances = new Map<string, unknown>()
  register<T>(token: Token<T>, instance: T) {
    this.instances.set(token, instance as unknown)
  }
  resolve<T>(token: Token<T>): T {
    const i = this.instances.get(token)
    if (!i) throw new Error(`Dependency not found: ${token}`)
    return i as T
  }
}

export type { Token }
