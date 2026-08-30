import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

console.log(`Node ${process.version}`)
console.log(fs.existsSync('.clasp.json') ? 'Apps Script: configured locally (ID redacted)' : 'Apps Script: not configured')
console.log(fs.existsSync('dist/index.html') ? 'Web build: present' : 'Web build: not built')
const clasp = spawnSync('clasp', ['status'], { encoding: 'utf8', shell: process.platform === 'win32' })
if (clasp.status === 0) console.log(clasp.stdout.trim())
else console.log('clasp status unavailable; run clasp login if needed')
