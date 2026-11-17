import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_SERVER_URL = 'http://127.0.0.1:8000'

export function normalizeServerUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_SERVER_URL
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
}

/**
 * Runtime server URL.
 *
 * Priority:
 *   1. DUCKDESK_SERVER_URL (for scripted/portable launches)
 *   2. %APPDATA%\desktop\server-url.txt (editable without rebuilding)
 *   3. the URL compiled into the build (CLOUDFLARE_URL)
 *   4. localhost fallback
 */
export function getServerUrl(): string {
  const fromEnvironment = process.env.DUCKDESK_SERVER_URL
  if (fromEnvironment) return normalizeServerUrl(fromEnvironment)

  try {
    const file = path.join(app.getPath('userData'), 'server-url.txt')
    if (fs.existsSync(file)) {
      const fromFile = fs.readFileSync(file, 'utf8').trim()
      if (fromFile) return normalizeServerUrl(fromFile)
    }
  } catch {
    // A missing/unreadable file simply falls through to the build default.
  }

  return normalizeServerUrl(process.env.CLOUDFLARE_URL || DEFAULT_SERVER_URL)
}

export function toWebSocketUrl(baseUrl: string): string {
  return `${baseUrl.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:')}/ws`
}
