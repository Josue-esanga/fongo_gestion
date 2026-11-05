import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// URLs du backend lues depuis l'environnement (port dynamique).
// Renamed Vite ne resout pas import.meta.env dans defineConfig, on utilise
// donc process.env qui est injecte par Vite au demarrage.
const backendUrl =
  process.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000'
const mediaUrl = process.env.VITE_MEDIA_URL ?? backendUrl
const staticUrl = process.env.VITE_STATIC_URL ?? backendUrl

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/media': {
        target: mediaUrl,
        changeOrigin: true,
      },
      '/static': {
        target: staticUrl,
        changeOrigin: true,
      },
    },
  },
})
