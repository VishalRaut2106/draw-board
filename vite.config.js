import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      NODE_ENV: 'production',
      IS_PREACT: 'false',
    },
  },
  resolve: {
    alias: {
      // Force the working dev bundle instead of the broken prod bundle
      '@excalidraw/excalidraw': fileURLToPath(new URL('./node_modules/@excalidraw/excalidraw/dist/dev/index.js', import.meta.url)),
    },
  },
})

