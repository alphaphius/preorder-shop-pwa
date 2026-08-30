import fs from 'node:fs'
import readline from 'node:readline/promises'

const file = '.clasp.json'
if (fs.existsSync(file)) {
  const current = JSON.parse(fs.readFileSync(file, 'utf8'))
  console.log(`Apps Script is configured (${String(current.scriptId || '').slice(0, 6)}…redacted)`)
  process.exit(0)
}
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const scriptId = (await rl.question('Apps Script ID: ')).trim()
rl.close()
if (!/^[A-Za-z0-9_-]{20,}$/.test(scriptId)) throw new Error('Invalid Apps Script ID')
fs.writeFileSync(file, JSON.stringify({ scriptId, rootDir: 'apps-script' }, null, 2) + '\n', { mode: 0o600 })
console.log('Created local .clasp.json (gitignored)')
