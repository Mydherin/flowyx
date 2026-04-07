import { create } from 'zustand'
import type { Video, ShareRecipient, VideoShare } from '../types/video'
import { videoService } from '../services/videoService'
import { shareService } from '../services/shareService'

interface VideoStore {
  // ─── State ───────────────────────────────────────────────────────────────────
  videos: Video[]
  shareRecipients: ShareRecipient[]
  loading: boolean
  error: string | null

  // ─── Actions ─────────────────────────────────────────────────────────────────
  fetchMyVideos: () => Promise<void>
  silentRefreshMyVideos: () => Promise<void>
  patchVideo: (id: string, patch: Partial<Video>) => void
  setVideos: (videos: Video[]) => void
  bulkRemoveVideos: (ids: string[]) => void
  reconcileShareRecipients: (videoId: string, newShares: VideoShare[]) => void
  clearError: () => void
}

export const useVideoStore = create<VideoStore>((set) => ({
  videos: [],
  shareRecipients: [],
  loading: false,
  error: null,

  fetchMyVideos: async () => {
    set({ loading: true, error: null })
    try {
      const [videos, shareRecipients] = await Promise.all([
        videoService.list(),
        shareService.getRecipients().catch(() => [] as ShareRecipient[]),
      ])
      set({ videos, shareRecipients, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load videos',
        loading: false,
      })
    }
  },

  // Fetches fresh data without showing a loading spinner — used as a background
  // reconciliation step after mutations (e.g. sharing) to guarantee UI consistency.
  silentRefreshMyVideos: async () => {
    try {
      const [videos, shareRecipients] = await Promise.all([
        videoService.list(),
        shareService.getRecipients().catch(() => [] as ShareRecipient[]),
      ])
      set({ videos, shareRecipients })
    } catch {
      // silent — the optimistic patch is still visible, no error shown
    }
  },

  patchVideo: (id, patch) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    })),

  setVideos: (videos) => set({ videos }),

  bulkRemoveVideos: (ids) => {
    const idSet = new Set(ids)
    set((state) => ({ videos: state.videos.filter((v) => !idSet.has(v.id)) }))
  },

  reconcileShareRecipients: (videoId, newShares) => {
    const newShareUserIds = new Set(newShares.map((s) => s.userId))
    set((state) => {
      const updated = state.shareRecipients
        .map((r) => {
          const had = r.videoIds.includes(videoId)
          const has = newShareUserIds.has(r.userId)
          if (had && !has) return { ...r, videoIds: r.videoIds.filter((id) => id !== videoId) }
          if (!had && has) return { ...r, videoIds: [...r.videoIds, videoId] }
          return r
        })
        .filter((r) => r.videoIds.length > 0)

      const existingIds = new Set(updated.map((r) => r.userId))
      const added: ShareRecipient[] = newShares
        .filter((s) => !existingIds.has(s.userId))
        .map((s) => ({
          userId: s.userId,
          nickname: s.nickname,
          pictureUrl: s.pictureUrl,
          videoIds: [videoId],
        }))

      return { shareRecipients: [...updated, ...added] }
    })
  },

  clearError: () => set({ error: null }),
}))
