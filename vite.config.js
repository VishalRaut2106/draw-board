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
    alias: [
      {
        // Use regex with $ to match ONLY the exact package import,
        // not sub-path imports like '@excalidraw/excalidraw/index.css'
        find: /^@excalidraw\/excalidraw$/,
        replacement: fileURLToPath(new URL('./node_modules/@excalidraw/excalidraw/dist/dev/index.js', import.meta.url)),
      },
    ],
  },
})


