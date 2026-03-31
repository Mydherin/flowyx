import { useCallback, useEffect, useMemo, useState } from 'react'
import { Upload, Film } from 'lucide-react'
import type { Video } from '../types/video'
import { videoService } from '../services/videoService'
import { VideoCard } from '../components/video/VideoCard'
import { VideoPlayer } from '../components/video/VideoPlayer'
import { TagFilter } from '../components/video/TagFilter'
import { UploadModal } from '../components/video/UploadModal'
import { EditModal } from '../components/video/EditModal'
import { Button } from '../components/ui/Button'

export function DashboardPage() {
  // Always holds the full unfiltered list for the current user
  const [allVideos, setAllVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [playerIndex, setPlayerIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // All unique tags across the user's videos — used for filter bar + autocomplete
  const allTags = useMemo(() => {
    const set = new Set<string>()
    allVideos.forEach((v) => v.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [allVideos])

  // Client-side tag filter (AND semantics: video must have ALL active tags)
  const visibleVideos = useMemo(() => {
    if (!activeTags.length) return allVideos
    return allVideos.filter((v) => activeTags.every((t) => v.tags.includes(t)))
  }, [allVideos, activeTags])

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await videoService.list()
      setAllVideos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchVideos()
  }, [fetchVideos])

  // Optimistic delete — instant removal, revert on error
  const handleDelete = async (id: string) => {
    const snapshot = allVideos
    setAllVideos((prev) => prev.filter((v) => v.id !== id))
    try {
      await videoService.delete(id)
    } catch (err) {
      setAllVideos(snapshot)
      setError(err instanceof Error ? err.message : 'Failed to delete video')
    }
  }

  const handlePlay = (video: Video) => {
    const idx = visibleVideos.findIndex((v) => v.id === video.id)
    if (idx !== -1) setPlayerIndex(idx)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Your Videos</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {loading
              ? '…'
              : activeTags.length
              ? `${visibleVideos.length} of ${allVideos.length} video${allVideos.length !== 1 ? 's' : ''}`
              : `${allVideos.length} video${allVideos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowUpload(true)}
          className="shrink-0 gap-1.5"
        >
          <Upload size={13} />
          Upload
        </Button>
      </div>

      {/* Tag filter — horizontal scroll, shows all tags */}
      {allTags.length > 0 && (
        <TagFilter tags={allTags} activeTags={activeTags} onChange={setActiveTags} />
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-950/60 border border-red-900/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-bg-tertiary" />
              <div className="p-3 flex flex-col gap-2">
                <div className="h-3.5 bg-bg-tertiary rounded w-3/4" />
                <div className="h-3 bg-bg-tertiary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Film size={24} className="text-text-muted" />
          </div>
          <div>
            <p className="text-text-primary font-medium text-sm">
              {activeTags.length > 0 ? 'No videos match these tags' : 'No videos yet'}
            </p>
            <p className="text-text-muted text-xs mt-1">
              {activeTags.length > 0
                ? 'Try adjusting your filters'
                : 'Upload your first dance move to get started'}
            </p>
          </div>
          {activeTags.length === 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUpload(true)}
              className="gap-1.5"
            >
              <Upload size={13} />
              Upload video
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={handlePlay}
              onEdit={setEditingVideo}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Instagram-style video player */}
      {playerIndex !== null && (
        <VideoPlayer
          videos={visibleVideos}
          initialIndex={playerIndex}
          onClose={() => setPlayerIndex(null)}
        />
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          existingTags={allTags}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false)
            void fetchVideos()
          }}
        />
      )}

      {/* Edit modal */}
      {editingVideo && (
        <EditModal
          video={editingVideo}
          existingTags={allTags}
          onClose={() => setEditingVideo(null)}
          onSuccess={() => {
            setEditingVideo(null)
            void fetchVideos()
          }}
        />
      )}
    </div>
  )
}
