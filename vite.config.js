import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths for Capacitor Android & iOS WebViews
  server: {
    host: true, // Listen on all local IPs so mobile devices on the same Wi-Fi can open it
    port: 5173,
  },
})
