import { useAuthStore } from '../features/auth/store'
import type { Video } from '../types/video'

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

const CHUNK_SIZE = 2 * 1024 * 1024 // 2 MB — each request completes well within any proxy timeout

function sendChunk(
  videoId: string,
  index: number,
  chunk: Blob,
  token: string | null,
  signal: AbortSignal,
  onChunkProgress: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', `${API_BASE}/api/v1/videos/chunks/${videoId}/${index}`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onChunkProgress(e.loaded, e.total)
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
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

    signal.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(chunk)
  })
}

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
  async uploadChunked(
    file: File,
    thumbnail: Blob | null,
    description: string,
    tags: string[],
    onProgress: (percent: number) => void,
    signal: AbortSignal,
    onProcessing?: () => void,
  ): Promise<Video> {
    const videoId = crypto.randomUUID()
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const token = useAuthStore.getState().user?.accessToken ?? null

    for (let i = 0; i < totalChunks; i++) {
      if (signal.aborted) throw new DOMException('Upload cancelled', 'AbortError')

      const start = i * CHUNK_SIZE
      const chunk = file.slice(start, start + CHUNK_SIZE)

      await sendChunk(videoId, i, chunk, token, signal, (loaded, total) => {
        const overall = ((i + loaded / total) / totalChunks) * 95
        onProgress(Math.round(overall))
      })

      // Snap to the completed-chunk milestone (avoids floating point drift)
      onProgress(Math.round(((i + 1) / totalChunks) * 95))
    }

    onProcessing?.()

    const formData = new FormData()
    formData.append('description', description)
    formData.append('tags', tags.join(','))
    formData.append('totalChunks', String(totalChunks))
    formData.append('totalSize', String(file.size))
    formData.append('fileName', file.name)
    formData.append('contentType', file.type || 'video/mp4')
    if (thumbnail) formData.append('thumbnail', thumbnail, 'thumbnail.jpg')

    const response = await fetch(`${API_BASE}/api/v1/videos/chunks/${videoId}/complete`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
      throw new Error((err as { error: string }).error ?? `HTTP ${response.status}`)
    }
    return response.json() as Promise<Video>
  },

  uploadWithProgress(
    formData: FormData,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
    onProcessing?: () => void,
  ): Promise<Video> {
    return new Promise((resolve, reject) => {
      const token = useAuthStore.getState().user?.accessToken
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/api/v1/videos`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 95))
      })

      xhr.upload.addEventListener('load', () => onProcessing?.())

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
