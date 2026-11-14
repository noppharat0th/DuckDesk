import { CLOUDFLARE_URL } from '../config'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'

export const getBaseUrl = async (): Promise<string> => {
  return process.env.CLOUDFLARE_URL || CLOUDFLARE_URL || DEFAULT_API_URL
}

export const request = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<Response> => {
  const baseUrl = await getBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  const response = await fetch(`${baseUrl}${cleanPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    throw new Error(`api error ${method} ${path} (${response.status})`)
  }

  return response
}

export const api = {
  get: (path: string): Promise<Response> => request('GET', path),
  post: (path: string, body: unknown): Promise<Response> => request('POST', path, body),
  put: (path: string, body: unknown): Promise<Response> => request('PUT', path, body),
  delete: (path: string): Promise<Response> => request('DELETE', path)
}
