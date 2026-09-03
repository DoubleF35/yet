import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Per dominio custom (yetcommunity.it) la base dev'essere '/'
const REPO_NAME = ''

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    host: true,
  },
}))
