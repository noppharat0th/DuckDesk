export interface RecentConnection {
  id: string
  ts: number
  name?: string
}

const STORAGE_KEY = 'duck-recent'
const MAX_RECENT = 12
const DEVICE_ID_LENGTH = 9

const GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#f59e0b', '#f97316'],
  ['#0ea5e9', '#6366f1'],
  ['#8b5cf6', '#ec4899'],
  ['#10b981', '#0d9488'],
  ['#f43f5e', '#f97316'],
  ['#64748b', '#334155']
]

function hash(value: string): number {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0
  }
  return result
}

function isRecentConnection(value: unknown): value is RecentConnection {
  if (!value || typeof value !== 'object') return false

  const candidate = value as { id?: unknown; ts?: unknown; name?: unknown }
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.ts === 'number' &&
    (candidate.name === undefined || typeof candidate.name === 'string')
  )
}

export function normalizeDeviceId(value: string): string {
  return value.replace(/\D/g, '').slice(0, DEVICE_ID_LENGTH)
}

export function isValidDeviceId(value: string): boolean {
  return /^\d{9}$/.test(value)
}

/** Formats `482731259` as `482 731 259`. */
export function formatDeviceId(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(?=\d)/g, '$1 ')
    .trim()
}

export function connectionGradient(seed: string): readonly [string, string] {
  return GRADIENTS[hash(seed) % GRADIENTS.length]
}

export function connectionName(connection: RecentConnection): string {
  const storedName = connection.name?.trim()
  if (storedName) return storedName

  const suffix = connection.id.slice(-3)
  return `Computer ${suffix}`
}

export function timeAgo(timestamp: number): string {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))

  if (elapsedMinutes < 1) return 'Just now'
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`

  const elapsedHours = Math.round(elapsedMinutes / 60)
  if (elapsedHours < 24) return `${elapsedHours}h ago`

  const elapsedDays = Math.round(elapsedHours / 24)
  if (elapsedDays < 7) return `${elapsedDays}d ago`

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(timestamp)
}

export function loadRecentConnections(): RecentConnection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(isRecentConnection)
      .map(({ id, ts, name }) => ({ id, ts, name }))
      .sort((left, right) => right.ts - left.ts)
  } catch {
    return []
  }
}

export function saveRecentConnections(connections: RecentConnection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
  } catch {
    // Storage can be unavailable in private contexts; the in-memory list still works.
  }
}

export function upsertRecentConnection(
  connections: RecentConnection[],
  id: string,
  name?: string
): RecentConnection[] {
  const existing = connections.find((connection) => connection.id === id)
  const updated: RecentConnection = {
    id,
    ts: Date.now(),
    name: name?.trim() || existing?.name
  }

  const next = [updated, ...connections.filter((connection) => connection.id !== id)].slice(
    0,
    MAX_RECENT
  )

  saveRecentConnections(next)
  return next
}

export function removeRecentConnection(
  connections: RecentConnection[],
  id: string
): RecentConnection[] {
  const next = connections.filter((connection) => connection.id !== id)
  saveRecentConnections(next)
  return next
}

export function clearRecentConnections(): void {
  saveRecentConnections([])
}
