import { api } from './api'
import type { ShareRecipient, VideoShare } from '../types/video'

export const shareService = {
  getShares: (videoId: string) =>
    api.get<VideoShare[]>(`/api/v1/videos/${videoId}/shares`),

  getRecipients: () =>
    api.get<ShareRecipient[]>('/api/v1/videos/shares/recipients'),

  share: (videoId: string, userIds: string[]) =>
    api.post<void>(`/api/v1/videos/${videoId}/shares`, { userIds }),

  unshare: (videoId: string, userId: string) =>
    api.delete<void>(`/api/v1/videos/${videoId}/shares/${userId}`),

  bulkShare: (videoIds: string[], userIds: string[]) =>
    api.post<void>('/api/v1/videos/bulk-share', { videoIds, userIds }),
}
