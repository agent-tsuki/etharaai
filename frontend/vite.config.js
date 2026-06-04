import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BACKEND_TARGET lets docker-compose.dev.yml override the proxy target so the
// Node-side proxy can reach the backend via the Docker internal hostname.
// Locally (npm run dev on the host) it falls back to localhost:8000.
const backendTarget = process.env.BACKEND_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})
