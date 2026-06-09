import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind is configured via postcss.config.js, so no need for @tailwindcss/vite.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});

