import { useAuthStore } from '../features/auth/store'
import type { Video } from '../types/video'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().user?.accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...options.headers, ...authHeaders() },
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error((err as { error: string }).error ?? `HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const videoService = {
  uploadWithProgress(
    formData: FormData,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ): Promise<Video> {
    return new Promise((resolve, reject) => {
      const token = useAuthStore.getState().user?.accessToken
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/api/v1/videos`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as Video)
          } catch {
            reject(new Error('Invalid response'))
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText) as { error: string }
            reject(new Error(err.error ?? `HTTP ${xhr.status}`))
          } catch {
            reject(new Error(`HTTP ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Network error')))
      xhr.addEventListener('abort', () => reject(new DOMException('Upload cancelled', 'AbortError')))

      signal.addEventListener('abort', () => xhr.abort())

      xhr.send(formData)
    })
  },

  list: (tags?: string[]) => {
    const qs = tags?.length ? `?tags=${encodeURIComponent(tags.join(','))}` : ''
    return request<Video[]>(`/api/v1/videos${qs}`)
  },

  get: (id: string) => request<Video>(`/api/v1/videos/${id}`),

  update: (id: string, data: { description?: string; tags?: string[] }) =>
    request<Video>(`/api/v1/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/v1/videos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  },

  listShared: () => request<Video[]>('/api/v1/videos/shared'),

  bulkDelete: (ids: string[]) =>
    request<{ deletedIds: string[] }>('/api/v1/videos/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds: ids }),
    }),

  bulkUpdateTags: (ids: string[], tags: string[]) =>
    request<Video[]>('/api/v1/videos/bulk-tags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds: ids, tags }),
    }),

  clone: (id: string) =>
    request<Video>(`/api/v1/videos/${id}/clone`, { method: 'POST' }),

  bulkClone: (ids: string[]) =>
    request<Video[]>('/api/v1/videos/bulk-clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds: ids }),
    }),

  markViewed: (id: string) =>
    request<void>(`/api/v1/videos/${id}/viewed`, { method: 'POST' }),

  download: async (ids: string[]): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/v1/videos/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ videoIds: ids }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'videos.zip'
    a.click()
    URL.revokeObjectURL(url)
  },
}
