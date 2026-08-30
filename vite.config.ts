import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.CUSTOM_DOMAIN === 'true' ? '/' : repositoryName ? `/${repositoryName}/` : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022', sourcemap: true },
  test: { environment: 'jsdom', setupFiles: './tests/setup.ts' },
})
