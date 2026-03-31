import { useCallback, useRef, useState } from 'react'
import { X, Upload, Film, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { videoService } from '../../services/videoService'
import { captureVideoThumbnail } from '../../lib/thumbnail'
import { Button } from '../ui/Button'
import { TagInput } from '../ui/TagInput'

interface UploadItem {
  id: string
  file: File
  thumbnail: Blob | null
  thumbnailPreview: string | null
  tags: string[]
  tagsOpen: boolean
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error' | 'cancelled'
  error: string | null
  controller: AbortController
}

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
  existingTags: string[]
}

export function UploadModal({ onClose, onSuccess, existingTags }: UploadModalProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const addFiles = useCallback(
    (files: File[]) => {
      const videoFiles = files.filter((f) => f.type.startsWith('video/') || f.name.match(/\.(mp4|mov|webm|avi|mkv)$/i))
      if (!videoFiles.length) return

      const newItems: UploadItem[] = videoFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        thumbnail: null,
        thumbnailPreview: null,
        tags: [],
        tagsOpen: false,
        progress: 0,
        status: 'pending',
        error: null,
        controller: new AbortController(),
      }))

      setItems((prev) => [...prev, ...newItems])

      newItems.forEach((item) => {
        captureVideoThumbnail(item.file).then((thumb) => {
          if (thumb) {
            const preview = URL.createObjectURL(thumb)
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id ? { ...it, thumbnail: thumb, thumbnailPreview: preview } : it,
              ),
            )
          }
        })
      })
    },
    [],
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleUpload = async () => {
    const pending = items.filter((it) => it.status === 'pending')
    if (!pending.length) return
    setUploading(true)

    await Promise.allSettled(
      pending.map(async (item) => {
        updateItem(item.id, { status: 'uploading', progress: 0 })
        try {
          const formData = new FormData()
          formData.append('video', item.file)
          if (item.thumbnail) formData.append('thumbnail', item.thumbnail, 'thumbnail.jpg')
          formData.append('description', '')
          formData.append('tags', item.tags.join(','))

          await videoService.uploadWithProgress(
            formData,
            (pct) => updateItem(item.id, { progress: pct }),
            item.controller.signal,
          )
          updateItem(item.id, { status: 'done', progress: 100 })
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            updateItem(item.id, { status: 'cancelled' })
          } else {
            updateItem(item.id, {
              status: 'error',
              error: err instanceof Error ? err.message : 'Upload failed',
            })
          }
        }
      }),
    )

    setUploading(false)
  }

  const cancelItem = (item: UploadItem) => {
    item.controller.abort()
    updateItem(item.id, { status: 'cancelled' })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const retryItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, status: 'pending', progress: 0, error: null, controller: new AbortController() }
          : it,
      ),
    )
  }

  const pendingCount = items.filter((it) => it.status === 'pending').length
  const successCount = items.filter((it) => it.status === 'done').length
  const allSettled =
    items.length > 0 && items.every((it) => ['done', 'error', 'cancelled'].includes(it.status))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={uploading ? undefined : onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-bg-secondary border-0 sm:border sm:border-border-default rounded-t-2xl sm:rounded-2xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-text-primary font-semibold text-base">Upload videos</h2>
          <button
            onClick={uploading ? undefined : onClose}
            disabled={uploading}
            className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5 disabled:opacity-30"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 flex flex-col gap-3 min-h-0">
          {/* Dropzone */}
          {!uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={[
                'w-full border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-colors',
                dragOver
                  ? 'border-white/40 bg-white/5'
                  : 'border-border-default hover:border-white/20 hover:bg-white/3',
              ].join(' ')}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Film size={18} className="text-text-muted" />
              </div>
              <div className="text-center">
                <p className="text-text-primary text-sm font-medium">
                  {items.length > 0 ? 'Add more videos' : 'Choose videos'}
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  Click or drag & drop · MP4, MOV, WebM · up to 500 MB each
                </p>
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* File list */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2 pb-2">
              {items.map((item) => (
                <UploadItemRow
                  key={item.id}
                  item={item}
                  existingTags={existingTags}
                  onTagsChange={(tags) => updateItem(item.id, { tags })}
                  onToggleTags={() => updateItem(item.id, { tagsOpen: !item.tagsOpen })}
                  onRemove={() => removeItem(item.id)}
                  onCancel={() => cancelItem(item)}
                  onRetry={() => retryItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 shrink-0 flex gap-2 border-t border-white/5">
          {allSettled ? (
            <>
              {pendingCount === 0 && (
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setItems([])}
                >
                  Upload more
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  if (successCount > 0) onSuccess()
                  else onClose()
                }}
              >
                {successCount > 0
                  ? `Done · ${successCount} video${successCount > 1 ? 's' : ''} uploaded`
                  : 'Close'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="md"
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={pendingCount === 0 || uploading}
                onClick={() => void handleUpload()}
                className="flex-1 gap-2"
              >
                <Upload size={14} />
                {uploading
                  ? 'Uploading…'
                  : `Upload ${pendingCount} video${pendingCount !== 1 ? 's' : ''}`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface UploadItemRowProps {
  item: UploadItem
  existingTags: string[]
  onTagsChange: (tags: string[]) => void
  onToggleTags: () => void
  onRemove: () => void
  onCancel: () => void
  onRetry: () => void
}

function UploadItemRow({
  item,
  existingTags,
  onTagsChange,
  onToggleTags,
  onRemove,
  onCancel,
  onRetry,
}: UploadItemRowProps) {
  const isPending = item.status === 'pending'
  const isUploading = item.status === 'uploading'

  return (
    <div className="bg-bg-tertiary border border-border-default rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail preview */}
        <div className="w-14 h-10 rounded-lg bg-bg-secondary border border-white/5 shrink-0 flex items-center justify-center overflow-hidden">
          {item.thumbnailPreview ? (
            <img src={item.thumbnailPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <Film size={13} className="text-text-muted" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-xs font-medium truncate">{item.file.name}</p>
          <p className="text-text-muted text-xs">
            {(item.file.size / 1024 / 1024).toFixed(1)} MB
            {item.status === 'uploading' && (
              <span className="ml-1 tabular-nums">{item.progress}%</span>
            )}
          </p>
          {isUploading && (
            <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-[width] duration-200"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
          {item.status === 'error' && item.error && (
            <p className="text-red-400 text-xs mt-0.5 truncate">{item.error}</p>
          )}
          {item.status === 'cancelled' && (
            <p className="text-text-muted text-xs mt-0.5">Cancelled</p>
          )}
        </div>

        {/* Status icon + actions */}
        <div className="flex items-center gap-1 shrink-0">
          {item.status === 'done' && <CheckCircle2 size={15} className="text-green-400" />}
          {item.status === 'error' && (
            <>
              <AlertCircle size={15} className="text-red-400" />
              <button
                onClick={onRetry}
                className="text-text-muted hover:text-white transition-colors px-1.5 py-0.5 text-xs rounded hover:bg-white/5"
              >
                Retry
              </button>
            </>
          )}
          {item.status === 'cancelled' && (
            <>
              <XCircle size={15} className="text-text-muted" />
              <button
                onClick={onRetry}
                className="text-text-muted hover:text-white transition-colors px-1.5 py-0.5 text-xs rounded hover:bg-white/5"
              >
                Retry
              </button>
            </>
          )}
          {isUploading && (
            <button
              onClick={onCancel}
              title="Cancel upload"
              className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            >
              <X size={13} />
            </button>
          )}
          {isPending && (
            <>
              <button
                onClick={onToggleTags}
                className={[
                  'text-xs px-1.5 py-0.5 rounded transition-colors',
                  item.tagsOpen
                    ? 'text-white bg-white/10'
                    : 'text-text-muted hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                {item.tags.length > 0 ? `${item.tags.length} tag${item.tags.length > 1 ? 's' : ''}` : 'Tags'}
              </button>
              <button
                onClick={onRemove}
                className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/5"
              >
                <X size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline tag input — only for pending items */}
      {item.tagsOpen && isPending && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          <TagInput
            value={item.tags}
            onChange={onTagsChange}
            suggestions={existingTags.filter((t) => !item.tags.includes(t))}
            placeholder="Add tags…"
          />
        </div>
      )}
    </div>
  )
}
