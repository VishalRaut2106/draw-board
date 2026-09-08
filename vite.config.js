import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.IS_PREACT': JSON.stringify('false'),
  }
})
