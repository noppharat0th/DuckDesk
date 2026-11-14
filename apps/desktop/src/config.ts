/**
 * Signaling server configuration.
 *
 * The renderer build injects `process.env.CLOUDFLARE_URL` via
 * electron.vite.config.ts. The fallback keeps a local build usable without .env.
 */
export const CLOUDFLARE_URL = process.env.CLOUDFLARE_URL || 'http://127.0.0.1:8000'

export const WSS_URL = `${CLOUDFLARE_URL.replace('https://', 'wss://').replace(
  'http://',
  'ws://'
)}/ws`
