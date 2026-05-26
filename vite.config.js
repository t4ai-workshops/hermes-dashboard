import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite proxy configuration — connects the React dev server to:
 * - Hermes Web Dashboard API  (9119)  →  /api/hermes/*
 * - System metrics server     (9192)  →  /api/metrics/*
 * - Hermes API Server         (8642)  →  /api/v1/*
 * 
 * The metrics server (metrics_server.py) must be running separately.
 * Start it with: python3 metrics_server.py
 */

const HERMES_DASHBOARD = 'http://localhost:9119'
const METRICS_SERVER  = 'http://localhost:9192'
const API_SERVER      = 'http://localhost:8642'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/hermes': {
        target: HERMES_DASHBOARD,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hermes/, '/api'),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[vite proxy] Hermes dashboard unreachable:', err.message)
          })
        },
      },
      '/api/metrics': {
        target: METRICS_SERVER,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[vite proxy] Metrics server unreachable:', err.message)
          })
        },
      },
      '/api/v1': {
        target: API_SERVER,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[vite proxy] API server unreachable:', err.message)
          })
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
