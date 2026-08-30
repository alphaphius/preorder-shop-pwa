import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
const required = ['index.html', 'manifest.webmanifest', 'sw.js', 'icon.svg', 'runtime-config.js']
for (const name of required) {
  if (!fs.existsSync(path.join(dist, name))) throw new Error(`Missing dist/${name}`)
}
const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
if (!index.includes('manifest.webmanifest')) throw new Error('Manifest link missing')
const serviceWorker = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8')
if (!serviceWorker.includes("url.hostname === 'script.google.com'") || !serviceWorker.includes("url.hostname.endsWith('googleusercontent.com')")) throw new Error('Service worker must bypass Apps Script API origins')
const publicConfig = fs.readFileSync(path.join(root, 'public', 'runtime-config.js'), 'utf8')
const configuredExec = publicConfig.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/)
if (!configuredExec) throw new Error('public/runtime-config.js must contain the deployed Web App /exec URL for this single-store build')
console.log('Build contract verified')
