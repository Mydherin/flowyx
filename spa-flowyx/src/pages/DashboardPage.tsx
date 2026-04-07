import { useCallback, useEffect, useMemo, useState } from 'react'
import { Upload, Film } from 'lucide-react'
import type { Video } from '../types/video'
import { videoService } from '../services/videoService'
import { VideoPlayer } from '../components/video/VideoPlayer'
import { VirtualizedVideoGrid } from '../components/video/VirtualizedVideoGrid'
import { TagFilter } from '../components/video/TagFilter'
import { SharedWithFilter } from '../components/video/SharedWithFilter'
import { UploadModal } from '../components/video/UploadModal'
import { EditModal } from '../components/video/EditModal'
import { SelectionBar } from '../components/video/SelectionBar'
import { BulkTagEditModal } from '../components/video/BulkTagEditModal'
import { ShareModal } from '../features/sharing/components/ShareModal'
import { SharerSelect } from '../components/video/SharerSelect'
import { Button } from '../components/ui/Button'
import { useVideoStore } from '../stores/useVideoStore'
import { useSharedVideoStore } from '../stores/useSharedVideoStore'

type Tab = 'mine' | 'shared'

export function DashboardPage() {
  // ─── Store: my videos ────────────────────────────────────────────────────────
  const videos = useVideoStore((s) => s.videos)
  const shareRecipients = useVideoStore((s) => s.shareRecipients)
  const loadingMine = useVideoStore((s) => s.loading)
  const error = useVideoStore((s) => s.error)
  const fetchMyVideos = useVideoStore((s) => s.fetchMyVideos)
  const patchVideo = useVideoStore((s) => s.patchVideo)
  const setVideos = useVideoStore((s) => s.setVideos)
  const bulkRemoveVideos = useVideoStore((s) => s.bulkRemoveVideos)
  const reconcileShareRecipients = useVideoStore((s) => s.reconcileShareRecipients)
  const silentRefreshMyVideos = useVideoStore((s) => s.silentRefreshMyVideos)
  const clearError = useVideoStore((s) => s.clearError)

  // ─── Store: shared with me ───────────────────────────────────────────────────
  const sharedVideos = useSharedVideoStore((s) => s.videos)
  const loadingShared = useSharedVideoStore((s) => s.loading)
  const fetchSharedVideos = useSharedVideoStore((s) => s.fetchSharedVideos)
  const markVideoViewed = useSharedVideoStore((s) => s.markVideoViewed)

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('mine')

  const [activeTags, setActiveTags] = useState<string[]>([])
  const [activeRecipientIds, setActiveRecipientIds] = useState<string[]>([])

  const [selectedSharerId, setSelectedSharerId] = useState<string | null>(null)
  const [activeSharedTags, setActiveSharedTags] = useState<string[]>([])

  const [playerIndex, setPlayerIndex] = useState<number | null>(null)
  const [playerVideos, setPlayerVideos] = useState<Video[]>([])

  const [showUpload, setShowUpload] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [showBulkTagEdit, setShowBulkTagEdit] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ─── Derived: my videos ───────────────────────────────────────────────────────
  const allTags = useMemo(() => {
    const set = new Set<string>()
    videos.forEach((v) => v.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [videos])

  const selectedVideos = useMemo(
    () => videos.filter((v) => selectedIds.has(v.id)),
    [videos, selectedIds],
  )

  const commonTags = useMemo(() => {
    if (selectedVideos.length === 0) return []
    return selectedVideos[0].tags.filter((tag) =>
      selectedVideos.every((v) => v.tags.includes(tag)),
    )
  }, [selectedVideos])

  // Keep active recipient filter IDs in sync when shareRecipients changes.
  // Return the same reference when nothing is removed to avoid a spurious re-render.
  useEffect(() => {
    const validIds = new Set(shareRecipients.map((r) => r.userId))
    setActiveRecipientIds((prev) => {
      const next = prev.filter((id) => validIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [shareRecipients])

  const recipientVideoIdSet = useMemo(() => {
    if (!activeRecipientIds.length) return null
    const ids = new Set<string>()
    shareRecipients
      .filter((r) => activeRecipientIds.includes(r.userId))
      .forEach((r) => r.videoIds.forEach((id) => ids.add(id)))
    return ids
  }, [shareRecipients, activeRecipientIds])

  const visibleVideos = useMemo(() => {
    let result = videos
    if (activeTags.length) result = result.filter((v) => activeTags.every((t) => v.tags.includes(t)))
    if (recipientVideoIdSet) result = result.filter((v) => recipientVideoIdSet.has(v.id))
    return result
  }, [videos, activeTags, recipientVideoIdSet])

  const selectedCount = selectedIds.size
  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  // ─── Derived: shared tab ──────────────────────────────────────────────────────
  const sharers = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; nickname: string | null; pictureUrl: string | null }[] = []
    for (const v of sharedVideos) {
      if (v.sharedByUserId && !seen.has(v.sharedByUserId)) {
        seen.add(v.sharedByUserId)
        result.push({ id: v.sharedByUserId, nickname: v.sharedByNickname, pictureUrl: v.sharedByPictureUrl })
      }
    }
    return result
  }, [sharedVideos])

  const sharedBySelected = useMemo(
    () => (selectedSharerId ? sharedVideos.filter((v) => v.sharedByUserId === selectedSharerId) : sharedVideos),
    [sharedVideos, selectedSharerId],
  )

  const sharedTags = useMemo(() => {
    const set = new Set<string>()
    sharedBySelected.forEach((v) => v.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [sharedBySelected])

  const visibleSharedVideos = useMemo(() => {
    if (!activeSharedTags.length) return sharedBySelected
    return sharedBySelected.filter((v) => activeSharedTags.every((t) => v.tags.includes(t)))
  }, [sharedBySelected, activeSharedTags])

  // ─── Data fetching ────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'mine') void fetchMyVideos()
    else {
      void fetchSharedVideos().then(() => {
        const firstSharerId =
          useSharedVideoStore.getState().videos.find((v) => v.sharedByUserId)?.sharedByUserId ?? null
        setSelectedSharerId(firstSharerId)
        setActiveSharedTags([])
      })
    }
  }, [activeTab])

  // ─── Selection mode ───────────────────────────────────────────────────────────
  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  const enterSelectMode = useCallback((id: string) => {
    setIsSelectMode(true)
    setSelectedIds(new Set([id]))
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const anyModalOpen = showBulkTagEdit || showShareModal || showUpload || !!editingVideo || playerIndex !== null
  useEffect(() => {
    if (!isSelectMode || anyModalOpen) return
    document.addEventListener('click', exitSelectMode)
    return () => document.removeEventListener('click', exitSelectMode)
  }, [isSelectMode, anyModalOpen, exitSelectMode])

  // ─── Bulk download ────────────────────────────────────────────────────────────
  const handleBulkDownload = async () => {
    const ids = Array.from(selectedIds)
    exitSelectMode()
    try {
      await videoService.download(ids)
    } catch {
      // error is non-critical; silently ignore
    }
  }

  // ─── Bulk add to mine ─────────────────────────────────────────────────────────
  const handleBulkAddToMine = async () => {
    const ids = Array.from(selectedIds)
    exitSelectMode()
    try {
      await videoService.bulkClone(ids)
      setActiveTab('mine')
    } catch {
      // silently ignore
    }
  }

  // ─── Bulk delete ──────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCount} video${selectedCount !== 1 ? 's' : ''}? This cannot be undone.`)) return
    const snapshot = videos
    const idsToDelete = Array.from(selectedIds)
    bulkRemoveVideos(idsToDelete)
    exitSelectMode()
    try {
      const result = await videoService.bulkDelete(idsToDelete)
      const deletedSet = new Set(result.deletedIds.map(String))
      const toRestore = snapshot.filter((v) => selectedIds.has(v.id) && !deletedSet.has(v.id))
      if (toRestore.length) {
        setVideos([...useVideoStore.getState().videos, ...toRestore])
      }
    } catch {
      setVideos(snapshot)
    }
  }

  // ─── Play ─────────────────────────────────────────────────────────────────────
  const handlePlay = (video: Video, source: Video[]) => {
    const idx = source.findIndex((v) => v.id === video.id)
    if (idx !== -1) {
      setPlayerVideos(source)
      setPlayerIndex(idx)
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────────
  const renderGallery = (vids: Video[], readOnly: boolean) => {
    if (vids.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Film size={24} className="text-text-muted" />
          </div>
          <div>
            <p className="text-text-primary font-medium text-sm">
              {readOnly
                ? activeSharedTags.length > 0
                  ? 'No videos match these tags'
                  : 'No videos shared with you yet'
                : activeTags.length > 0
                ? 'No videos match these tags'
                : 'No videos yet'}
            </p>
            <p className="text-text-muted text-xs mt-1">
              {readOnly
                ? activeSharedTags.length > 0
                  ? 'Try adjusting your filters'
                  : 'Videos shared by other members will appear here'
                : activeTags.length > 0
                ? 'Try adjusting your filters'
                : 'Upload your first dance move to get started'}
            </p>
          </div>
          {!readOnly && activeTags.length === 0 && (
            <Button variant="primary" size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
              <Upload size={13} />
              Upload video
            </Button>
          )}
        </div>
      )
    }

    return (
      <VirtualizedVideoGrid
        videos={vids}
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        onTap={(video) => handlePlay(video, vids)}
        onLongPress={enterSelectMode}
        onToggleSelect={toggleSelect}
      />
    )
  }

  const loading = activeTab === 'mine' ? loadingMine : loadingShared

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Videos</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {loadingMine
              ? '…'
              : activeTab === 'mine'
              ? activeTags.length || activeRecipientIds.length
                ? `${visibleVideos.length} of ${videos.length} video${videos.length !== 1 ? 's' : ''}`
                : `${videos.length} video${videos.length !== 1 ? 's' : ''}`
              : activeSharedTags.length
              ? `${visibleSharedVideos.length} of ${sharedBySelected.length} video${sharedBySelected.length !== 1 ? 's' : ''}`
              : `${sharedBySelected.length} video${sharedBySelected.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            exitSelectMode()
            setShowUpload(true)
          }}
          className="shrink-0 gap-1.5"
        >
          <Upload size={13} />
          Upload
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-default">
        {(['mine', 'shared'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setActiveTab(tab)
              setActiveRecipientIds([])
              exitSelectMode()
            }}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'text-white border-white'
                : 'text-text-muted border-transparent hover:text-text-secondary',
            ].join(' ')}
          >
            {tab === 'mine' ? 'My Videos' : 'Shared with me'}
          </button>
        ))}
      </div>

      {/* Filters — my videos tab */}
      {activeTab === 'mine' && (allTags.length > 0 || shareRecipients.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap mb-4" onClick={(e) => e.stopPropagation()}>
          {allTags.length > 0 && (
            <TagFilter tags={allTags} activeTags={activeTags} onChange={setActiveTags} />
          )}
          {shareRecipients.length > 0 && (
            <SharedWithFilter
              recipients={shareRecipients}
              activeIds={activeRecipientIds}
              onChange={setActiveRecipientIds}
            />
          )}
        </div>
      )}

      {/* Sharer selector + tag filter — shared tab */}
      {activeTab === 'shared' && sharers.length > 0 && (
        <div className="mb-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-xs font-medium uppercase tracking-wide shrink-0">From</span>
            <SharerSelect
              sharers={sharers}
              selectedId={selectedSharerId}
              onChange={(id) => { setSelectedSharerId(id); setActiveSharedTags([]) }}
            />
          </div>
          {sharedTags.length > 0 && (
            <TagFilter tags={sharedTags} activeTags={activeSharedTags} onChange={setActiveSharedTags} />
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg bg-red-950/60 border border-red-900/40 text-red-400 text-sm cursor-pointer"
          onClick={clearError}
        >
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-0.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="aspect-video bg-bg-secondary animate-pulse rounded-sm" />
          ))}
        </div>
      ) : activeTab === 'mine' ? (
        renderGallery(visibleVideos, false)
      ) : (
        renderGallery(visibleSharedVideos, true)
      )}

      {/* Video player */}
      {playerIndex !== null && (
        <VideoPlayer
          videos={playerVideos}
          initialIndex={playerIndex}
          onClose={() => setPlayerIndex(null)}
          onVideoViewed={(id) => markVideoViewed(id)}
        />
      )}

      {/* Selection bar */}
      {isSelectMode && (
        <SelectionBar
          count={selectedCount}
          onEditTags={activeTab === 'mine' ? () => setShowBulkTagEdit(true) : undefined}
          onShare={activeTab === 'mine' ? () => setShowShareModal(true) : undefined}
          onDelete={activeTab === 'mine' ? () => void handleBulkDelete() : undefined}
          onAddToMine={activeTab === 'shared' ? () => void handleBulkAddToMine() : undefined}
          onDownload={() => void handleBulkDownload()}
        />
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal
          existingTags={allTags}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); void fetchMyVideos() }}
        />
      )}

      {editingVideo && (
        <EditModal
          video={editingVideo}
          existingTags={allTags}
          onClose={() => setEditingVideo(null)}
          onSuccess={() => { setEditingVideo(null); void fetchMyVideos() }}
        />
      )}

      {showBulkTagEdit && (
        <BulkTagEditModal
          videoIds={selectedIdsArray}
          initialTags={commonTags}
          existingTags={allTags}
          onClose={() => setShowBulkTagEdit(false)}
          onSuccess={(updated) => {
            updated.forEach((v) => patchVideo(v.id, { tags: v.tags }))
            setShowBulkTagEdit(false)
            exitSelectMode()
          }}
        />
      )}

      {showShareModal && (
        <ShareModal
          videoIds={selectedIdsArray}
          onClose={(result) => {
            setShowShareModal(false)
            exitSelectMode()
            if (result) {
              patchVideo(result.videoId, { sharedWithCount: result.shares.length })
              reconcileShareRecipients(result.videoId, result.shares)
            }
            // Silent background refresh guarantees the grid reflects the true server
            // state — covers any edge cases where the optimistic patch lags behind
            // (e.g. newly uploaded videos, virtualizer stale rows, StrictMode effects).
            void silentRefreshMyVideos()
          }}
        />
      )}

      {/* Bottom padding so content isn't hidden behind SelectionBar */}
      {isSelectMode && <div className="h-20" />}
    </div>
  )
}
