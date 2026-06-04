import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind is configured via postcss.config.js, so no need for @tailwindcss/vite.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/admin": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/bookings": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/vouchers": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/services": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/users": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/cars": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/payments": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});

