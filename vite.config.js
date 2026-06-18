import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT || '5180', 10),
    host: true, // Listen on all addresses
    strictPort: true, // Fixed port so we never collide with other local projects
  },
})
