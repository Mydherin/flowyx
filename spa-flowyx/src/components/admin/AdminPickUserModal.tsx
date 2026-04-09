import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { UserSearchResult } from '../../types/sharing'
import { Button } from '../ui/Button'
import { UserSearchInput } from '../../features/sharing/components/UserSearchInput'

interface AdminPickUserModalProps {
  /** Snapshot of selected video IDs captured at the time the modal was opened */
  videoIds: string[]
  /** The user whose page we're on — excluded from results (avoid copying back to source) */
  sourceUserId: string
  /** Called when the user dismisses the modal without copying (X, Cancel, backdrop) */
  onClose: () => void
  /** Called after all copy assignments succeed */
  onSuccess: () => void
}

export function AdminPickUserModal({
  videoIds,
  sourceUserId,
  onClose,
  onSuccess,
}: AdminPickUserModalProps) {
  const [pending, setPending] = useState<UserSearchResult[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pendingIds = new Set(pending.map((u) => u.id))
  const excludeIds = new Set([...pendingIds, sourceUserId])

  const handleAdd = (user: UserSearchResult) => {
    if (pendingIds.has(user.id)) return
    setPending((prev) => [...prev, user])
  }

  const handleRemove = (id: string) => {
    setPending((prev) => prev.filter((u) => u.id !== id))
  }

  const handleCopy = async () => {
    if (pending.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await Promise.all(
        pending.flatMap((user) =>
          videoIds.map((videoId) => adminService.assignVideoToUser(user.id, videoId)),
        ),
      )
      onSuccess()
    } catch {
      setError('Some assignments failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-md bg-bg-secondary border-0 sm:border sm:border-border-default rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-text-primary font-semibold text-base">Copy to users</h2>
            <p className="text-text-muted text-xs mt-0.5">
              {videoIds.length} video{videoIds.length !== 1 ? 's' : ''} will be added to their
              collection
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4 shrink-0">
          <UserSearchInput
            alreadySharedIds={excludeIds}
            addingId={null}
            onSelect={handleAdd}
            onSearch={adminService.searchUsers}
          />
        </div>

        {/* Pending list */}
        {pending.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
            <p className="text-text-muted text-xs font-medium mb-3 uppercase tracking-wider">
              Selected
            </p>
            <ul className="flex flex-col gap-0.5">
              {pending.map((user) => (
                <li key={user.id} className="flex items-center gap-3 py-2 px-2 rounded-lg">
                  {user.pictureUrl ? (
                    <img
                      src={user.pictureUrl}
                      alt={user.nickname}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs text-text-muted font-medium">
                        {user.nickname[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{user.nickname}</p>
                    <p className="text-text-muted text-xs truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(user.id)}
                    disabled={isSubmitting}
                    className="shrink-0 text-text-muted hover:text-white transition-colors p-1 rounded disabled:opacity-30"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 border-t border-border-default flex flex-col gap-2">
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <Button
            variant="primary"
            size="md"
            onClick={() => void handleCopy()}
            disabled={pending.length === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Copying…
              </span>
            ) : (
              `Copy to ${pending.length} user${pending.length !== 1 ? 's' : ''}`
            )}
          </Button>
          {!isSubmitting && (
            <Button variant="ghost" size="md" onClick={onClose} className="w-full">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
