import { create } from 'zustand'
import type { Video } from '../types/video'
import { videoService } from '../services/videoService'

interface SharedVideoStore {
  // ─── State ───────────────────────────────────────────────────────────────────
  videos: Video[]
  loading: boolean

  // ─── Actions ─────────────────────────────────────────────────────────────────
  fetchSharedVideos: () => Promise<void>
  markVideoViewed: (id: string) => void
}

export const useSharedVideoStore = create<SharedVideoStore>((set) => ({
  videos: [],
  loading: false,

  fetchSharedVideos: async () => {
    set({ loading: true })
    try {
      const videos = await videoService.listShared()
      set({ videos, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  markVideoViewed: (id) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, isNew: false } : v)),
    })),
}))
