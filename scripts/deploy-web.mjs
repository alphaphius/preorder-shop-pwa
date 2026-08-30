import { spawnSync } from 'node:child_process'

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status || 1)
}
run('npm', ['run', 'build'])
console.log('dist is ready for GitHub Pages. Push the repository to trigger the Pages workflow.')
