import { useCallback, useEffect, useState } from 'react'
import { X, Loader2, Users } from 'lucide-react'
import { shareService } from '../../../services/shareService'
import type { VideoShare } from '../../../types/video'
import type { UserSearchResult } from '../../../types/sharing'
import { Button } from '../../../components/ui/Button'
import { UserSearchInput } from './UserSearchInput'

interface ShareModalProps {
  videoIds: string[]
  onClose: (result?: { videoId: string; shares: VideoShare[] }) => void
}

export function ShareModal({ videoIds, onClose }: ShareModalProps) {
  const [shares, setShares] = useState<VideoShare[]>([])
  const [loadingShares, setLoadingShares] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isBulk = videoIds.length > 1

  const loadShares = useCallback(async () => {
    setLoadingShares(true)
    try {
      if (isBulk) {
        // Load shares for all videos in parallel then keep only the intersection
        const allShares = await Promise.all(videoIds.map((id) => shareService.getShares(id)))
        const first = allShares[0] ?? []
        const common = first.filter((s) =>
          allShares.every((list) => list.some((x) => x.userId === s.userId)),
        )
        setShares(common)
      } else {
        const data = await shareService.getShares(videoIds[0])
        setShares(data)
      }
    } catch {
      setError('Failed to load shares')
    } finally {
      setLoadingShares(false)
    }
  }, [videoIds, isBulk])

  useEffect(() => {
    void loadShares()
  }, [loadShares])

  const handleAdd = async (user: UserSearchResult) => {
    setAddingId(user.id)
    setError(null)
    try {
      if (isBulk) {
        await shareService.bulkShare(videoIds, [user.id])
      } else {
        await shareService.share(videoIds[0], [user.id])
      }
      const newShare: VideoShare = {
        userId: user.id,
        nickname: user.nickname,
        email: user.email,
        pictureUrl: user.pictureUrl,
        sharedAt: new Date().toISOString(),
      }
      setShares((prev) => [...prev.filter((s) => s.userId !== user.id), newShare])
    } catch {
      setError('Failed to add member')
    } finally {
      setAddingId(null)
    }
  }

  const handleRemove = async (userId: string) => {
    setRemovingId(userId)
    setError(null)
    try {
      if (isBulk) {
        await Promise.all(videoIds.map((vid) => shareService.unshare(vid, userId)))
      } else {
        await shareService.unshare(videoIds[0], userId)
      }
      setShares((prev) => prev.filter((s) => s.userId !== userId))
    } catch {
      setError('Failed to remove member')
    } finally {
      setRemovingId(null)
    }
  }

  // For single-video mode the result carries back the final shares and the videoId
  // so the caller never needs to read from a stale closure.
  const handleClose = () => {
    if (isBulk) {
      onClose(undefined)
    } else {
      onClose({ videoId: videoIds[0], shares })
    }
  }

  const alreadySharedIds = new Set(shares.map((s) => s.userId))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full sm:max-w-md bg-bg-secondary border-0 sm:border sm:border-border-default rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-text-primary font-semibold text-base">Share</h2>
            {isBulk && (
              <p className="text-text-muted text-xs mt-0.5">{videoIds.length} videos selected</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4 shrink-0">
          <UserSearchInput
            alreadySharedIds={alreadySharedIds}
            addingId={addingId}
            onSelect={(u) => void handleAdd(u)}
          />
        </div>

        {/* Shares list */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-950/60 border border-red-900/40 text-red-400 text-sm">
              {error}
            </div>
          )}

          <p className="text-text-muted text-xs font-medium mb-3 uppercase tracking-wider">
            {isBulk ? 'Shared with (all selected)' : 'Shared with'}
          </p>

          {loadingShares ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="text-text-muted animate-spin" />
            </div>
          ) : shares.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Users size={18} className="text-text-muted" />
              </div>
              <p className="text-text-muted text-sm">
                {isBulk ? 'No users shared with all selected videos' : 'Not shared with anyone yet'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {shares.map((share) => (
                <li
                  key={share.userId}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/3 transition-colors"
                >
                  {share.pictureUrl ? (
                    <img
                      src={share.pictureUrl}
                      alt={share.nickname}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs text-text-muted font-medium">
                        {share.nickname[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{share.nickname}</p>
                    <p className="text-text-muted text-xs truncate">{share.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(share.userId)}
                    disabled={removingId === share.userId || addingId !== null}
                    className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-30 shrink-0"
                    title="Remove access"
                  >
                    {removingId === share.userId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <X size={14} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 border-t border-border-default">
          <Button variant="ghost" size="md" onClick={handleClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
