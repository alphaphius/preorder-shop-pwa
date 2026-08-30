import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

if (!fs.existsSync('.clasp.json')) throw new Error('Run npm run setup:apps-script first')
const run = (args) => {
  const result = spawnSync('clasp', args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status || 1)
}
run(['push'])
console.log('Apps Script source pushed. Run setupSystem(), authorize it, then deploy or redeploy as a Web App from Apps Script.')
