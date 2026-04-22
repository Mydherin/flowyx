import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelectModeExitOnClickout } from '../../hooks/useSelectModeExitOnClickout'
import { useNavigate, useParams } from 'react-router'
import { useFilterStore } from '../../stores/useFilterStore'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { adminService, type AdminUser } from '../../services/adminService'
import type { Video, ShareRecipient } from '../../types/video'
import { VirtualizedVideoGrid } from '../../components/video/VirtualizedVideoGrid'
import { TagFilter } from '../../components/video/TagFilter'
import { SharedWithFilter } from '../../components/video/SharedWithFilter'
import { SelectionBar } from '../../components/video/SelectionBar'
import { VideoPlayer } from '../../components/video/VideoPlayer'
import { AdminPickUserModal } from '../../components/admin/AdminPickUserModal'
import { RemakeScreenshotsModal } from '../../components/video/RemakeScreenshotsModal'
import { UserRoleBadge } from '../../components/admin/UserRoleBadge'
import { Button } from '../../components/ui/Button'

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [recipients, setRecipients] = useState<ShareRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters — persisted in the global filter store so they survive navigation
  const activeTags         = useFilterStore((s) => s.admin[userId!]?.activeTags ?? [])
  const activeRecipientIds = useFilterStore((s) => s.admin[userId!]?.activeRecipientIds ?? [])
  const setAdminTags       = useFilterStore((s) => s.setAdminTags)
  const setAdminRecipients = useFilterStore((s) => s.setAdminRecipientIds)
  const pruneAdminTags     = useFilterStore((s) => s.pruneAdminTags)
  const ensureAdminEntry   = useFilterStore((s) => s.ensureAdminEntry)

  const setActiveTags         = useCallback((tags: string[]) => setAdminTags(userId!, tags), [setAdminTags, userId])
  const setActiveRecipientIds = useCallback((ids: string[]) => setAdminRecipients(userId!, ids), [setAdminRecipients, userId])

  // Selection mode
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modals
  const [playerIndex, setPlayerIndex] = useState<number | null>(null)
  const [showPickUser, setShowPickUser] = useState(false)
  // Snapshot of selected IDs captured when the modal opens — avoids the
  // event-bubbling race where exitSelectMode() clears selectedIds before
  // the assignment runs.
  const [assigningVideoIds, setAssigningVideoIds] = useState<string[]>([])
  const [showRemakeScreenshots, setShowRemakeScreenshots] = useState(false)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const [allUsers, userVideos, shareRecipients] = await Promise.all([
        adminService.listUsers(),
        adminService.getUserVideos(userId),
        adminService.getShareRecipients(userId),
      ])
      setUser(allUsers.find((u) => u.id === userId) ?? null)
      setVideos(userVideos)
      setRecipients(shareRecipients)
    } catch {
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Seed a stable store entry so filter selectors never return a new [] reference
  useEffect(() => {
    ensureAdminEntry(userId!)
  }, [userId, ensureAdminEntry])

  const allTags = useMemo(
    () => [...new Set(videos.flatMap((v) => v.tags))].sort(),
    [videos],
  )

  // Keep active tag filters in sync when allTags changes.
  // Automatically removes tags from filter if they no longer exist.
  useEffect(() => {
    if (userId) pruneAdminTags(userId, allTags)
  }, [allTags, userId, pruneAdminTags])

  const visibleVideos = useMemo(() => {
    let result = videos
    if (activeTags.length > 0) {
      result = result.filter((v) => activeTags.every((t) => v.tags.includes(t)))
    }
    if (activeRecipientIds.length > 0) {
      const recipientVideoIdSets = activeRecipientIds.map(
        (rid) => new Set(recipients.find((r) => r.userId === rid)?.videoIds ?? []),
      )
      result = result.filter((v) =>
        recipientVideoIdSets.every((idSet) => idSet.has(v.id)),
      )
    }
    return result
  }, [videos, activeTags, activeRecipientIds, recipients])

  const selectedVideos = useMemo(
    () => visibleVideos.filter((v) => selectedIds.has(v.id)),
    [visibleVideos, selectedIds],
  )

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }, [])

  const anyModalOpen = showPickUser || playerIndex !== null || showRemakeScreenshots
  useSelectModeExitOnClickout(isSelectMode && !anyModalOpen, exitSelectMode)

  const handleTap = (video: Video) => {
    if (isSelectMode) {
      toggleSelect(video.id)
    } else {
      setPlayerIndex(visibleVideos.findIndex((v) => v.id === video.id))
    }
  }

  const handleLongPress = (id: string) => {
    setIsSelectMode(true)
    setSelectedIds(new Set([id]))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleRoleChange = async (newRole: 'USER' | 'ADMIN') => {
    if (!user) return
    const updated = await adminService.updateUserRole(user.id, newRole)
    setUser(updated)
  }

  const openAssignModal = () => {
    // Snapshot the IDs now — before event bubbling can call exitSelectMode()
    // and clear selectedIds out from under the modal.
    setAssigningVideoIds([...selectedIds])
    setShowPickUser(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-red-400 text-sm">{error ?? 'User not found'}</p>
        <Button variant="ghost" size="sm" onClick={() => void navigate('/admin')}>
          Back to users
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          type="button"
          onClick={() => void navigate('/admin')}
          className="mt-0.5 p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {user.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.nickname}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-sm font-medium text-text-secondary">
                  {user.nickname[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-text-primary font-semibold text-base">{user.nickname}</span>
            <UserRoleBadge role={user.role} onChange={handleRoleChange} />
          </div>
          <span className="text-text-muted text-xs mt-0.5 block">{user.email}</span>
        </div>
      </div>

      {/* Filters — tag filter + shared-with filter, same as "My Videos" tab */}
      {(allTags.length > 0 || recipients.length > 0) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {allTags.length > 0 && (
            <TagFilter tags={allTags} activeTags={activeTags} onChange={setActiveTags} />
          )}
          {recipients.length > 0 && (
            <SharedWithFilter
              recipients={recipients}
              activeIds={activeRecipientIds}
              onChange={setActiveRecipientIds}
            />
          )}
        </div>
      )}

      {/* Video count */}
      <p className="text-text-muted text-xs mb-3">
        {visibleVideos.length} video{visibleVideos.length !== 1 ? 's' : ''}
        {activeTags.length > 0 || activeRecipientIds.length > 0 ? ' (filtered)' : ''}
      </p>

      {/* Videos */}
      {visibleVideos.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          {activeTags.length > 0 || activeRecipientIds.length > 0
            ? 'No videos match the selected filters.'
            : 'This user has no videos.'}
        </div>
      ) : (
        <VirtualizedVideoGrid
          videos={visibleVideos}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onTap={handleTap}
          onLongPress={handleLongPress}
          onToggleSelect={toggleSelect}
        />
      )}

      {/* Selection bar — only "assign to user" action */}
      {isSelectMode && (
        <SelectionBar
          count={selectedIds.size}
          totalCount={visibleVideos.length}
          onSelectAll={() => setSelectedIds(new Set(visibleVideos.map((v) => v.id)))}
          onDeselectAll={() => setSelectedIds(new Set())}
          onCopyToUser={openAssignModal}
          onRemakeScreenshots={() => setShowRemakeScreenshots(true)}
        />
      )}

      {/* Video player */}
      {playerIndex !== null && (
        <VideoPlayer
          videos={visibleVideos}
          initialIndex={playerIndex}
          onClose={() => setPlayerIndex(null)}
        />
      )}

      {/* Pick target users for assignment */}
      {showRemakeScreenshots && (
        <RemakeScreenshotsModal
          videos={selectedVideos}
          onClose={() => setShowRemakeScreenshots(false)}
          onSuccess={() => { setShowRemakeScreenshots(false); exitSelectMode(); void fetchData() }}
          updateThumbnail={(id, blob) => adminService.updateVideoThumbnail(id, blob)}
        />
      )}

      {showPickUser && (
        <AdminPickUserModal
          videoIds={assigningVideoIds}
          sourceUserId={user.id}
          onClose={() => setShowPickUser(false)}
          onSuccess={() => { setShowPickUser(false); exitSelectMode() }}
        />
      )}
    </div>
  )
}
