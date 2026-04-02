import { useState } from 'react'
import { X } from 'lucide-react'
import type { Video } from '../../types/video'
import { videoService } from '../../services/videoService'
import { Button } from '../ui/Button'
import { TagInput } from '../ui/TagInput'

interface BulkTagEditModalProps {
  videoIds: string[]
  existingTags: string[]
  onClose: () => void
  onSuccess: (updated: Video[]) => void
}

export function BulkTagEditModal({ videoIds, existingTags, onClose, onSuccess }: BulkTagEditModalProps) {
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const updated = await videoService.bulkUpdateTags(videoIds, tags)
      onSuccess(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tags')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-bg-secondary border-0 sm:border sm:border-border-default rounded-t-2xl sm:rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-text-primary font-semibold text-base">Edit tags</h2>
            <p className="text-text-muted text-xs mt-0.5">
              Replaces tags on {videoIds.length} video{videoIds.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-xs font-medium">New tags</label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={existingTags.filter((t) => !tags.includes(t))}
              placeholder="Add tags…"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-950/60 border border-red-900/40 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="md" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={saving || tags.length === 0}
              className="flex-1"
            >
              {saving ? 'Saving…' : 'Apply tags'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
