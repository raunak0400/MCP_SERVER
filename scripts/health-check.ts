// Simple health check script
// Usage: npm run check:health -- --url http://localhost:3000/health

const args = new Map<string, string>()
for (let i = 2; i < process.argv.length; i++) {
  const [k, v] = process.argv[i].split('=')
  if (k && v) args.set(k.replace(/^--/, ''), v)
}

const url = args.get('url') || process.env.HEALTH_URL || 'http://localhost:3000/health'

async function main() {
  try {
    const res = await fetch(url)
    const text = await res.text()
    const ok = res.ok
    console.log(`[health] ${url} -> ${res.status} ${res.statusText}`)
    try {
      const json = JSON.parse(text)
      console.log(JSON.stringify(json, null, 2))
    } catch {
      console.log(text)
    }
    process.exit(ok ? 0 : 1)
  } catch (e: any) {
    console.error(`[health] error:`, e?.message || e)
    process.exit(2)
  }
}

main()
