import { api } from './api'
import type { VideoShare } from '../types/video'

export const shareService = {
  getShares: (videoId: string) =>
    api.get<VideoShare[]>(`/api/v1/videos/${videoId}/shares`),

  share: (videoId: string, userIds: string[]) =>
    api.post<void>(`/api/v1/videos/${videoId}/shares`, { userIds }),

  unshare: (videoId: string, userId: string) =>
    api.delete<void>(`/api/v1/videos/${videoId}/shares/${userId}`),

  bulkShare: (videoIds: string[], userIds: string[]) =>
    api.post<void>('/api/v1/videos/bulk-share', { videoIds, userIds }),
}
