export const request = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
) => {
    const res = await fetch(`${process.env.API_URL}/${path}`, {
        body: body
    })

    if (!res.ok) {
        throw new Error("api error" + path)
    }

    return res
}

export const api = {
    get: (path: string) => request('GET', path),
    post: (path: string, body: any) => request('POST', path),
    put: (path: string, body: any) => request('PUT', path),
    delete: (path: string) => request('DELETE', path)
}