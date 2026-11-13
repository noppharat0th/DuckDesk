
import { CLOUDFLARE_URL } from '../config'

export const getBaseUrl = async (): Promise<string> => {
    return process.env.CLOUDFLARE_URL || CLOUDFLARE_URL
}

export const request = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
) => {
    const baseUrl = await getBaseUrl()
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    const res = await fetch(`${baseUrl}${cleanPath}`, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    })

    if (!res.ok) {
        throw new Error(`api error ${method} ${path} (${res.status})`)
    }

    return res
}

export const api = {
    get: (path: string) => request('GET', path),
    post: (path: string, body: any) => request('POST', path, body),
    put: (path: string, body: any) => request('PUT', path, body),
    delete: (path: string) => request('DELETE', path)
}
