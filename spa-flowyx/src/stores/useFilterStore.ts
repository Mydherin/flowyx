import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyVideosFilters {
  activeTags: string[]
  activeRecipientIds: string[]
}

interface SharedFilters {
  selectedSharerId: string | null
  activeSharedTags: string[]
  /** True once the first sharer has been auto-selected — prevents re-init on tab re-entry. */
  sharerInitialized: boolean
}

interface AdminFilters {
  activeTags: string[]
  activeRecipientIds: string[]
}

interface FilterStore {
  // ─── State ─────────────────────────────────────────────────────────────────
  myVideos: MyVideosFilters
  shared: SharedFilters
  /** Per-user filter state for the admin detail view, keyed by userId. */
  admin: Record<string, AdminFilters>

  // ─── My Videos actions ─────────────────────────────────────────────────────
  setMyVideosTags: (tags: string[]) => void
  setMyVideosRecipientIds: (ids: string[]) => void
  /**
   * Removes any stored recipient ID that is no longer valid.
   * Returns the same state reference when nothing changed — avoids a spurious re-render.
   */
  pruneMyVideosRecipientIds: (validIds: string[]) => void

  // ─── Shared tab actions ────────────────────────────────────────────────────
  /**
   * Changes the selected sharer and atomically clears activeSharedTags.
   * A different sharer exposes a different tag set, so keeping stale tags is confusing.
   */
  setSelectedSharerId: (id: string | null) => void
  setActiveSharedTags: (tags: string[]) => void
  /**
   * Auto-selects the first sharer on initial tab load.
   * No-op once `sharerInitialized` is true — safe to call on every `sharedVideos` update.
   */
  initializeSharer: (firstSharerId: string | null) => void

  // ─── Admin actions ─────────────────────────────────────────────────────────
  setAdminTags: (userId: string, tags: string[]) => void
  setAdminRecipientIds: (userId: string, ids: string[]) => void
  /** Seeds a stable entry for `userId` so selectors never return a new `[]` reference. */
  ensureAdminEntry: (userId: string) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

const DEFAULT_ADMIN: AdminFilters = { activeTags: [], activeRecipientIds: [] }

export const useFilterStore = create<FilterStore>((set) => ({
  myVideos: { activeTags: [], activeRecipientIds: [] },
  shared: { selectedSharerId: null, activeSharedTags: [], sharerInitialized: false },
  admin: {},

  setMyVideosTags: (tags) =>
    set((s) => ({ myVideos: { ...s.myVideos, activeTags: tags } })),

  setMyVideosRecipientIds: (ids) =>
    set((s) => ({ myVideos: { ...s.myVideos, activeRecipientIds: ids } })),

  pruneMyVideosRecipientIds: (validIds) =>
    set((s) => {
      const validSet = new Set(validIds)
      const prev = s.myVideos.activeRecipientIds
      const next = prev.filter((id) => validSet.has(id))
      if (next.length === prev.length) return s // same reference — no re-render
      return { myVideos: { ...s.myVideos, activeRecipientIds: next } }
    }),

  setSelectedSharerId: (id) =>
    set((s) => ({ shared: { ...s.shared, selectedSharerId: id, activeSharedTags: [] } })),

  setActiveSharedTags: (tags) =>
    set((s) => ({ shared: { ...s.shared, activeSharedTags: tags } })),

  initializeSharer: (firstSharerId) =>
    set((s) => {
      if (s.shared.sharerInitialized) return s // no-op after first call
      return { shared: { ...s.shared, selectedSharerId: firstSharerId, sharerInitialized: true } }
    }),

  setAdminTags: (userId, tags) =>
    set((s) => ({
      admin: { ...s.admin, [userId]: { ...(s.admin[userId] ?? DEFAULT_ADMIN), activeTags: tags } },
    })),

  setAdminRecipientIds: (userId, ids) =>
    set((s) => ({
      admin: { ...s.admin, [userId]: { ...(s.admin[userId] ?? DEFAULT_ADMIN), activeRecipientIds: ids } },
    })),

  ensureAdminEntry: (userId) =>
    set((s) => {
      if (s.admin[userId]) return s
      return { admin: { ...s.admin, [userId]: { ...DEFAULT_ADMIN } } }
    }),
}))
