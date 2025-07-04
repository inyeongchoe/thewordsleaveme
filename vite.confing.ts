import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  // ↓ this makes all your assets load from “/assets/…” on the root domain
  base: '/',

  root: '.',
  publicDir: 'public',
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    outDir: 'dist',
    rollupOptions: { input: 'index.html' },
  },
  server: { port: 5173, open: true },
})
