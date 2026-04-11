import { useCallback, useRef, useState } from 'react'
import { X, Upload, Film, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { videoService } from '../../services/videoService'
import { captureVideoThumbnail } from '../../lib/thumbnail'
import { Button } from '../ui/Button'
import { TagInput } from '../ui/TagInput'
import { BottomSheet } from '../ui/BottomSheet'

interface UploadItem {
  id: string
  file: File
  thumbnail: Blob | null
  thumbnailPreview: string | null
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error' | 'cancelled'
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
  const [globalTags, setGlobalTags] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  // Tracks whether the native file picker is open (including any iOS preprocessing delay)
  const [selecting, setSelecting] = useState(false)

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  // Opens the native file picker and shows a preparing state while it is open.
  // On iOS, the OS may transcode videos (HEVC → H.264) before returning them to the
  // browser — this can take several seconds with no visible feedback. By tracking the
  // picker lifecycle we can display a spinner during that window.
  const openFilePicker = useCallback(() => {
    setSelecting(true)

    const onReturn = () => {
      // Short grace period so handleFileInputChange can fire first and clear the state
      setTimeout(() => setSelecting(false), 400)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onReturn)
    }

    // visibilitychange: reliable on iOS (page goes hidden when photo library opens)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') onReturn()
    }

    // focus: reliable on desktop (window regains focus when OS dialog closes)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onReturn)

    fileInputRef.current?.click()
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
        progress: 0,
        status: 'pending',
        error: null,
        controller: new AbortController(),
      }))

      setItems((prev) => [...prev, ...newItems])

      newItems.forEach((item) => {
        captureVideoThumbnail(item.file).then((thumb) => {
          if (!thumb) return
          const preview = URL.createObjectURL(thumb)
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, thumbnail: thumb, thumbnailPreview: preview } : it,
            ),
          )
        })
      })
    },
    [],
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelecting(false)
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
          await videoService.uploadChunked(
            item.file,
            item.thumbnail,
            '',
            globalTags,
            (pct) => updateItem(item.id, { progress: pct }),
            item.controller.signal,
            () => updateItem(item.id, { status: 'processing', progress: 95 }),
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
  const doneCount = items.filter((it) => it.status === 'done').length
  const allSettled =
    items.length > 0 && items.every((it) => ['done', 'error', 'cancelled'].includes(it.status))

  return (
    <BottomSheet
      onBackdropClick={uploading ? undefined : onClose}
      maxWidth="sm:max-w-lg"
      maxHeight="max-h-[90dvh]"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-text-primary font-semibold text-base">Upload videos</h2>
            {items.length > 0 && (
              <span className="text-text-muted text-xs">
                {allSettled
                  ? `${successCount} uploaded`
                  : uploading
                    ? `${doneCount} of ${items.length} done`
                    : null}
              </span>
            )}
          </div>
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
          {!uploading && selecting && (
            <div className="w-full border-2 border-dashed border-border-default rounded-xl p-5 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Loader2 size={18} className="text-text-muted animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-text-primary text-sm font-medium">Preparing videos…</p>
                <p className="text-text-muted text-xs mt-0.5">This may take a moment on iPhone</p>
              </div>
            </div>
          )}
          {!uploading && !selecting && (
            <button
              type="button"
              onClick={openFilePicker}
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
                  Click or drag & drop · MP4, MOV, WebM & more · up to 500 MB each
                </p>
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-matroska,video/x-msvideo,.mp4,.mov,.m4v,.webm,.mkv,.avi"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Global tags section */}
          {items.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-text-secondary text-xs font-medium">
                Tags — applied to all videos
              </label>
              {!uploading ? (
                <TagInput
                  value={globalTags}
                  onChange={setGlobalTags}
                  suggestions={existingTags}
                  placeholder="Add tags…"
                />
              ) : globalTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {globalTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* File list */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2 pb-2">
              {items.map((item) => (
                <UploadItemRow
                  key={item.id}
                  item={item}
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
    </BottomSheet>
  )
}

interface UploadItemRowProps {
  item: UploadItem
  onRemove: () => void
  onCancel: () => void
  onRetry: () => void
}

function UploadItemRow({ item, onRemove, onCancel, onRetry }: UploadItemRowProps) {
  const isPending = item.status === 'pending'
  const isUploading = item.status === 'uploading'
  const isProcessing = item.status === 'processing'
  const isActive = isUploading || isProcessing

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
            {isUploading && (
              <span className="ml-1 tabular-nums">{item.progress}%</span>
            )}
            {isProcessing && (
              <span className="ml-1">Processing…</span>
            )}
          </p>
          {isActive && (
            <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={[
                  'h-full rounded-full transition-[width] duration-200',
                  isProcessing ? 'bg-white/60 animate-pulse w-[95%]' : 'bg-white',
                ].join(' ')}
                style={isUploading ? { width: `${item.progress}%` } : undefined}
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
          {isProcessing && <Loader2 size={15} className="animate-spin text-text-muted" />}
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
            <button
              onClick={onRemove}
              className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
