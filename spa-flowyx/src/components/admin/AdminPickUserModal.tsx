import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { adminService } from '../../services/adminService'
import type { UserSearchResult } from '../../types/sharing'
import { Button } from '../ui/Button'
import { UserSearchInput } from '../../features/sharing/components/UserSearchInput'

interface AdminPickUserModalProps {
  /** Snapshot of selected video IDs captured at the time the modal was opened */
  videoIds: string[]
  /** The user whose page we're on — excluded from results via alreadySharedIds */
  sourceUserId: string
  onClose: () => void
}

interface AssignedEntry {
  user: UserSearchResult
  status: 'loading' | 'done' | 'error'
}

export function AdminPickUserModal({ videoIds, sourceUserId, onClose }: AdminPickUserModalProps) {
  const [assigned, setAssigned] = useState<AssignedEntry[]>([])
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const assignedIds = new Set(assigned.map((e) => e.user.id))
  // Exclude both already-assigned users and the source user from search results
  const excludeIds = new Set([...assignedIds, sourceUserId])

  const handleAdd = async (user: UserSearchResult) => {
    if (assigningId || assignedIds.has(user.id)) return

    setAssigningId(user.id)
    setAssigned((prev) => [...prev, { user, status: 'loading' }])

    try {
      await Promise.all(
        videoIds.map((videoId) => adminService.assignVideoToUser(user.id, videoId)),
      )
      setAssigned((prev) =>
        prev.map((e) => (e.user.id === user.id ? { ...e, status: 'done' } : e)),
      )
    } catch {
      setAssigned((prev) =>
        prev.map((e) => (e.user.id === user.id ? { ...e, status: 'error' } : e)),
      )
    } finally {
      setAssigningId(null)
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
            <h2 className="text-text-primary font-semibold text-base">Assign to users</h2>
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
            addingId={assigningId}
            onSelect={(u) => void handleAdd(u)}
          />
        </div>

        {/* Assigned list */}
        {assigned.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
            <p className="text-text-muted text-xs font-medium mb-3 uppercase tracking-wider">
              Assigned to
            </p>
            <ul className="flex flex-col gap-0.5">
              {assigned.map((entry) => (
                <li
                  key={entry.user.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg"
                >
                  {entry.user.pictureUrl ? (
                    <img
                      src={entry.user.pictureUrl}
                      alt={entry.user.nickname}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <span className="text-xs text-text-muted font-medium">
                        {entry.user.nickname[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {entry.user.nickname}
                    </p>
                    <p className="text-text-muted text-xs truncate">{entry.user.email}</p>
                  </div>
                  <div className="shrink-0">
                    {entry.status === 'loading' && (
                      <Loader2 size={14} className="animate-spin text-text-muted" />
                    )}
                    {entry.status === 'done' && (
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <Check size={13} />
                        Done
                      </div>
                    )}
                    {entry.status === 'error' && (
                      <span className="text-red-400 text-xs">Failed</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 shrink-0 border-t border-border-default">
          <Button variant="ghost" size="md" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
