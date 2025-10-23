// Dump metrics from the server in JSON or text formats
// Usage examples:
//   npm run metrics:dump -- --url http://localhost:3000/metrics
//   npm run metrics:dump -- --url http://localhost:3000/metrics --format txt
//   npm run metrics:dump -- --url http://localhost:3000/metrics --out metrics

import { writeFile } from 'fs/promises'

type Args = Map<string, string>
const parseArgs = (): Args => {
  const m = new Map<string, string>()
  for (let i = 2; i < process.argv.length; i++) {
    const [k, v] = process.argv[i].split('=')
    if (k && v) m.set(k.replace(/^--/, ''), v)
  }
  return m
}

async function main() {
  const args = parseArgs()
  const baseUrl = args.get('url') || 'http://localhost:3000/metrics'
  const format = (args.get('format') || 'json').toLowerCase()
  const outBase = args.get('out') // if provided, write to files instead of console

  const url = format === 'txt' ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}format=txt` : baseUrl
  const res = await fetch(url)
  const body = await res.text()
  if (!res.ok) {
    console.error(`[metrics] HTTP ${res.status}: ${res.statusText}`)
    console.error(body)
    process.exit(1)
  }

  if (outBase) {
    if (format === 'txt') {
      await writeFile(`${outBase}.txt`, body, 'utf8')
      console.log(`[metrics] wrote ${outBase}.txt`)
    } else {
      // pretty-print JSON
      const json = JSON.stringify(JSON.parse(body), null, 2)
      await writeFile(`${outBase}.json`, json, 'utf8')
      console.log(`[metrics] wrote ${outBase}.json`)
    }
  } else {
    if (format === 'txt') console.log(body)
    else console.log(JSON.stringify(JSON.parse(body), null, 2))
  }
}

main().catch((e) => {
  console.error('[metrics] error:', e?.message || e)
  process.exit(2)
})
