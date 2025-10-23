// Execute a plugin action via the server's /mcp/execute endpoint.
// Usage:
//   npm run plugin:run -- --plugin sample --action time
//   npm run plugin:run -- --plugin sample --action echo --payload '{"msg":"hi"}'

function getArg(name: string, def?: string) {
  const found = process.argv.find(a => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : def
}

const baseUrl = getArg('url', 'http://localhost:3000')!
const plugin = getArg('plugin')
const action = getArg('action')
const payloadArg = getArg('payload')

if (!plugin || !action) {
  console.error('Usage: --plugin <name> --action <name> [--payload <json>] [--url <base>]')
  process.exit(1)
}

let payload: any
if (payloadArg) {
  try { payload = JSON.parse(payloadArg) } catch { payload = payloadArg }
}

async function main() {
  const url = `${baseUrl.replace(/\/$/, '')}/mcp/execute`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plugin, action, payload })
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`[plugin:run] HTTP ${res.status}: ${res.statusText}`)
    console.error(text)
    process.exit(2)
  }
  try { console.log(JSON.stringify(JSON.parse(text), null, 2)) }
  catch { console.log(text) }
}

main().catch((e) => {
  console.error('[plugin:run] fatal:', e?.message || e)
  process.exit(3)
})
