import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Relative base so the built site works under a sub-path (GitHub Pages).
  base: command === 'build' ? './' : '/',
}))
