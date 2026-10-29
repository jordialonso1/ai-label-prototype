import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const root = import.meta.dirname

/* Every prototype is a folder with its own index.html. Add new ones here. */
const prototypes = ['ai-label-prototype', 'signup-login-flow']

/* Plain static folders (not bundled, e.g. HTML loaded in an iframe) that must
   be copied as-is into dist. In dev Vite already serves them from the root. */
const staticDirs = ['ai-label-prototype/prototype', 'signup-login-flow/prototype']

function copyStaticDirs(): Plugin {
  return {
    name: 'copy-static-dirs',
    apply: 'build',
    closeBundle() {
      for (const dir of staticDirs) {
        const from = resolve(root, dir)
        if (existsSync(from)) {
          cpSync(from, resolve(root, 'dist', dir), { recursive: true })
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), copyStaticDirs()],
  // Relative base so the built site works under a sub-path (GitHub Pages).
  base: command === 'build' ? './' : '/',
  resolve: {
    alias: { '@shared': resolve(root, 'shared-design-system') },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        ...Object.fromEntries(
          prototypes.map((name) => [name, resolve(root, name, 'index.html')]),
        ),
      },
    },
  },
}))
