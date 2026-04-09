import { api } from './api'
import type { Video, ShareRecipient } from '../types/video'
import type { UserSearchResult } from '../types/sharing'

export interface AdminUser {
  id: string
  nickname: string
  email: string
  pictureUrl: string | null
  role: string
  createdAt: string
}

export const adminService = {
  listUsers: () => api.get<AdminUser[]>('/api/v1/admin/users'),

  updateUserRole: (userId: string, role: 'USER' | 'ADMIN') =>
    api.patch<AdminUser>(`/api/v1/admin/users/${userId}/role`, { role }),

  getUserVideos: (userId: string, tags?: string[]) => {
    const qs = tags?.length ? `?tags=${encodeURIComponent(tags.join(','))}` : ''
    return api.get<Video[]>(`/api/v1/admin/users/${userId}/videos${qs}`)
  },

  getShareRecipients: (userId: string) =>
    api.get<ShareRecipient[]>(`/api/v1/admin/users/${userId}/share-recipients`),

  assignVideoToUser: (targetUserId: string, videoId: string) =>
    api.post<Video>(`/api/v1/admin/users/${targetUserId}/videos/${videoId}/assign`),

  searchUsers: (q: string) =>
    api.get<UserSearchResult[]>(`/api/v1/admin/users/search?q=${encodeURIComponent(q)}`),

  updateVideoThumbnail: (videoId: string, thumbnail: Blob): Promise<void> => {
    const formData = new FormData()
    formData.append('thumbnail', thumbnail, 'thumbnail.jpg')
    return api.patchMultipart<void>(`/api/v1/admin/videos/${videoId}/thumbnail`, formData)
  },
}
