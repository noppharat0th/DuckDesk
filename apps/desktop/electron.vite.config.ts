import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const define = {
    'process.env.CLOUDFLARE_URL': JSON.stringify(env.CLOUDFLARE_URL ?? '')
  }

  return {
    main: {
      define
    },
    preload: {},
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      define,
      plugins: [react(), tailwindcss()]
    }
  }
})
