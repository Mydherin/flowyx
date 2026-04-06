import { useCallback, useEffect, useMemo, useState } from 'react'
import { Upload, Film } from 'lucide-react'
import type { Video } from '../types/video'
import { videoService } from '../services/videoService'
import { VideoPlayer } from '../components/video/VideoPlayer'
import { VirtualizedVideoGrid } from '../components/video/VirtualizedVideoGrid'
import { TagFilter } from '../components/video/TagFilter'
import { UploadModal } from '../components/video/UploadModal'
import { EditModal } from '../components/video/EditModal'
import { SelectionBar } from '../components/video/SelectionBar'
import { BulkTagEditModal } from '../components/video/BulkTagEditModal'
import { ShareModal } from '../features/sharing/components/ShareModal'
import { SharerSelect } from '../components/video/SharerSelect'
import { Button } from '../components/ui/Button'

type Tab = 'mine' | 'shared'

export function DashboardPage() {
  // ─── My Videos ───────────────────────────────────────────────────────────────
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [loadingMine, setLoadingMine] = useState(true)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // ─── Shared with me ───────────────────────────────────────────────────────────
  const [sharedVideos, setSharedVideos] = useState<Video[]>([])
  const [loadingShared, setLoadingShared] = useState(false)
  const [selectedSharerId, setSelectedSharerId] = useState<string | null>(null)
  const [activeSharedTags, setActiveSharedTags] = useState<string[]>([])

  // ─── Tabs ─────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('mine')

  // ─── Player ──────────────────────────────────────────────────────────────────
  const [playerIndex, setPlayerIndex] = useState<number | null>(null)
  const [playerVideos, setPlayerVideos] = useState<Video[]>([])

  // ─── Modals ──────────────────────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [showBulkTagEdit, setShowBulkTagEdit] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // ─── Selection mode ───────────────────────────────────────────────────────────
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const selectedVideos = useMemo(
    () => allVideos.filter((v) => selectedIds.has(v.id)),
    [allVideos, selectedIds]
  )

  const commonTags = useMemo(() => {
    if (selectedVideos.length === 0) return []
    return selectedVideos[0].tags.filter((tag) =>
      selectedVideos.every((v) => v.tags.includes(tag))
    )
  }, [selectedVideos])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    allVideos.forEach((v) => v.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [allVideos])

  const visibleVideos = useMemo(() => {
    if (!activeTags.length) return allVideos
    return allVideos.filter((v) => activeTags.every((t) => v.tags.includes(t)))
  }, [allVideos, activeTags])

  const selectedCount = selectedIds.size
  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  // ─── Shared tab derived ───────────────────────────────────────────────────────
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
    () => selectedSharerId ? sharedVideos.filter((v) => v.sharedByUserId === selectedSharerId) : sharedVideos,
    [sharedVideos, selectedSharerId]
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
  const fetchMyVideos = useCallback(async () => {
    setLoadingMine(true)
    setError(null)
    try {
      const data = await videoService.list()
      setAllVideos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setLoadingMine(false)
    }
  }, [])

  const fetchSharedVideos = useCallback(async () => {
    setLoadingShared(true)
    try {
      const data = await videoService.listShared()
      setSharedVideos(data)
      // Auto-select first sharer; reset tags on each refresh
      const firstSharerId = data.find((v) => v.sharedByUserId)?.sharedByUserId ?? null
      setSelectedSharerId(firstSharerId)
      setActiveSharedTags([])
    } catch {
      // silently fail; user sees empty state
    } finally {
      setLoadingShared(false)
    }
  }, [])

  // Fetch the active tab's data on every tab switch (and on mount for 'mine')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'mine') void fetchMyVideos()
    else void fetchSharedVideos()
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

  // Document-level click listener exits select mode when clicking anywhere outside
  // of a VideoGalleryCard (which stops propagation) or SelectionBar (which also stops propagation).
  // Suspended while any modal is open so modal interactions don't dismiss select mode.
  const anyModalOpen = showBulkTagEdit || showShareModal || showUpload || !!editingVideo || playerIndex !== null
  useEffect(() => {
    if (!isSelectMode || anyModalOpen) return
    document.addEventListener('click', exitSelectMode)
    return () => document.removeEventListener('click', exitSelectMode)
  }, [isSelectMode, anyModalOpen, exitSelectMode])

  // ─── Bulk add to mine (shared tab) ───────────────────────────────────────────
  const handleBulkAddToMine = async () => {
    const ids = Array.from(selectedIds)
    exitSelectMode()
    try {
      await videoService.bulkClone(ids)
      // Switch to My Videos so the user sees their new clones
      setActiveTab('mine')
    } catch {
      setError('Failed to add videos to your library')
    }
  }

  // ─── Bulk delete ──────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCount} video${selectedCount !== 1 ? 's' : ''}? This cannot be undone.`)) return
    const snapshot = allVideos
    const idsToDelete = new Set(selectedIds) // capture before exit
    setAllVideos((prev) => prev.filter((v) => !idsToDelete.has(v.id)))
    exitSelectMode()
    try {
      const result = await videoService.bulkDelete(Array.from(idsToDelete))
      const deletedSet = new Set(result.deletedIds.map(String))
      // Restore any that the server didn't delete
      setAllVideos((prev) => {
        const notDeleted = snapshot.filter((v) => idsToDelete.has(v.id) && !deletedSet.has(v.id))
        return notDeleted.length ? [...prev, ...notDeleted] : prev
      })
    } catch {
      setAllVideos(snapshot)
      setError('Failed to delete videos')
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
  const renderGallery = (videos: Video[], readOnly: boolean) => {
    if (videos.length === 0) {
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
        videos={videos}
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        onTap={(video) => handlePlay(video, videos)}
        onLongPress={enterSelectMode}
        onToggleSelect={toggleSelect}
      />
    )
  }

  const loading = activeTab === 'mine' ? loadingMine : loadingShared

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header — always the same layout; Upload exits select mode if active */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Videos</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {loadingMine
              ? '…'
              : activeTab === 'mine'
              ? activeTags.length
                ? `${visibleVideos.length} of ${allVideos.length} video${allVideos.length !== 1 ? 's' : ''}`
                : `${allVideos.length} video${allVideos.length !== 1 ? 's' : ''}`
              : activeSharedTags.length
              ? `${visibleSharedVideos.length} of ${sharedBySelected.length} video${sharedBySelected.length !== 1 ? 's' : ''}`
              : `${sharedBySelected.length} video${sharedBySelected.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation() // prevent document listener from immediately dismissing
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

      {/* Tag filter — my videos tab */}
      {activeTab === 'mine' && allTags.length > 0 && (
        <div onClick={(e) => e.stopPropagation()}>
          <TagFilter tags={allTags} activeTags={activeTags} onChange={setActiveTags} />
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
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-950/60 border border-red-900/40 text-red-400 text-sm">
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
        />
      )}

      {/* Selection bar — actions differ by tab */}
      {isSelectMode && (
        <SelectionBar
          count={selectedCount}
          onEditTags={activeTab === 'mine' ? () => setShowBulkTagEdit(true) : undefined}
          onShare={activeTab === 'mine' ? () => setShowShareModal(true) : undefined}
          onDelete={activeTab === 'mine' ? () => void handleBulkDelete() : undefined}
          onAddToMine={activeTab === 'shared' ? () => void handleBulkAddToMine() : undefined}
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
            setAllVideos((prev) => prev.map((v) => updated.find((u) => u.id === v.id) ?? v))
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
            if (result && selectedIdsArray.length === 1) {
              const videoId = selectedIdsArray[0]
              const count = result.shares.length
              setAllVideos((prev) =>
                prev.map((v) => (v.id === videoId ? { ...v, sharedWithCount: count } : v))
              )
            }
          }}
        />
      )}

      {/* Bottom padding so content isn't hidden behind SelectionBar */}
      {isSelectMode && <div className="h-20" />}
    </div>
  )
}
