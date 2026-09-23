import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* Pinned to this file's own directory so the dev server serves this app no
   matter which directory it is launched from. */
const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  plugins: [react()],
  server: { port: 3000, strictPort: true },
})
