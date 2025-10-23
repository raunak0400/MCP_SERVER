// Connect to the WebSocket server and send a message, then exit.
// Usage: npm run ws:send -- --url ws://localhost:3000 --message "hello"

import { WebSocket } from 'ws'

function getArg(name: string, def?: string) {
  const found = process.argv.find(a => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : def
}

const url = getArg('url', 'ws://localhost:3000')!
const message = getArg('message', 'ping')
const timeoutMs = Number(getArg('timeoutMs', '2000'))

async function main() {
  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(url)
    let settled = false

    const done = (err?: any) => {
      if (settled) return
      settled = true
      try { ws.close() } catch {}
      err ? reject(err) : resolve()
    }

    const timer = setTimeout(() => {
      console.warn(`[ws-send] timeout after ${timeoutMs}ms`)
      done()
    }, timeoutMs)

    ws.on('open', () => {
      console.log('[ws-send] connected, sending message')
      ws.send(JSON.stringify({ type: 'cli', payload: message, timestamp: Date.now() }))
    })
    ws.on('message', (data: Buffer) => {
      console.log('[ws-send] received:', data.toString())
      clearTimeout(timer)
      done()
    })
    ws.on('error', (err) => {
      console.error('[ws-send] error:', err)
      clearTimeout(timer)
      done(err)
    })
    ws.on('close', () => {
      clearTimeout(timer)
      done()
    })
  })
}

main().catch((e) => {
  console.error('[ws-send] fatal:', e?.message || e)
  process.exit(2)
})
