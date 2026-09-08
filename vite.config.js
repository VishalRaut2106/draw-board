import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Replace the entire process.env object so Excalidraw picks the right bundle
    'process.env': {
      NODE_ENV: 'production',
      IS_PREACT: 'false',
    },
  }
})
