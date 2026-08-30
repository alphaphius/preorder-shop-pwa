import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status || 1)
}
if (!fs.existsSync('node_modules')) run('npm', ['install'])
run(process.execPath, ['scripts/setup-apps-script.mjs'])
run('npm', ['run', 'verify'])
console.log('Setup complete. Run setupSystem() from the bound Google Sheet before deploying the Web App.')
