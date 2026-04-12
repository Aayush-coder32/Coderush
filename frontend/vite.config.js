import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 3001 — 5173/5174 se alag, aksar khali rehta hai
    port: 3001,
    strictPort: false,
    proxy: {
      // 127.0.0.1 avoids Windows "localhost" → IPv6 (::1) mismatch when API binds IPv4 only
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
