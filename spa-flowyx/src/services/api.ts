import { useAuthStore } from '../features/auth/store'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().user?.accessToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL ?? ''}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/** Sends a multipart/form-data request. Do NOT set Content-Type manually —
 *  the browser sets it automatically (with the correct boundary). */
async function multipartRequest<T>(method: string, path: string, body: FormData): Promise<T> {
  const token = useAuthStore.getState().user?.accessToken
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE_URL ?? ''}${path}`, { method, headers, body })
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  if (response.status === 204 || response.status === 205) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  patchMultipart: <T>(path: string, body: FormData) => multipartRequest<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
