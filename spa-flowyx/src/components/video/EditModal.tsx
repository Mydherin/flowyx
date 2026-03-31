import { useState } from 'react'
import { X } from 'lucide-react'
import type { Video } from '../../types/video'
import { videoService } from '../../services/videoService'
import { Button } from '../ui/Button'
import { TagInput } from '../ui/TagInput'

interface EditModalProps {
  video: Video
  onClose: () => void
  onSuccess: () => void
  existingTags: string[]
}

export function EditModal({ video, onClose, onSuccess, existingTags }: EditModalProps) {
  const [description, setDescription] = useState(video.description)
  const [tags, setTags] = useState<string[]>(video.tags)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await videoService.update(video.id, {
        description: description.trim(),
        tags,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-bg-secondary border-0 sm:border sm:border-border-default rounded-t-2xl sm:rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-text-primary font-semibold text-base">Edit video</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-xs font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-text-secondary text-xs font-medium">Tags</label>
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

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
