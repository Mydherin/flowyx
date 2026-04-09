import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Video } from '../../types/video'
import { extractVideoFrame } from '../../lib/videoFrameExtractor'
import { Button } from '../ui/Button'

interface RemakeScreenshotsModalProps {
  videos: Video[]
  onClose: () => void
  onSuccess: () => void
  updateThumbnail: (videoId: string, blob: Blob) => Promise<void>
}

type ModalState = 'confirm' | 'processing' | 'done'

export function RemakeScreenshotsModal({
  videos,
  onClose,
  onSuccess,
  updateThumbnail,
}: RemakeScreenshotsModalProps) {
  const [state, setState] = useState<ModalState>('confirm')
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(0)

  const handleConfirm = async () => {
    setState('processing')
    setProgress(0)
    setFailed(0)

    let failCount = 0
    for (const video of videos) {
      try {
        const blob = await extractVideoFrame(video.videoUrl)
        await updateThumbnail(video.id, blob)
      } catch {
        failCount++
      }
      setProgress((prev) => prev + 1)
    }

    setFailed(failCount)
    setState('done')
    onSuccess()
  }

  const succeeded = progress - failed

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={state === 'confirm' ? onClose : undefined}
      />
      <div className="relative w-full sm:max-w-md bg-bg-secondary border-0 sm:border sm:border-border-default rounded-t-2xl sm:rounded-2xl p-6">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-text-primary font-semibold text-base">Regenerate thumbnails</h2>
            <p className="text-text-muted text-xs mt-0.5">
              {state === 'confirm' && `${videos.length} video${videos.length !== 1 ? 's' : ''} selected`}
              {state === 'processing' && `${progress} / ${videos.length} processed`}
              {state === 'done' && (failed === 0 ? 'All done' : `${succeeded} succeeded, ${failed} failed`)}
            </p>
          </div>
          {state !== 'processing' && (
            <button
              onClick={onClose}
              className="text-text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {state === 'confirm' && (
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary text-sm px-3 py-3 rounded-lg bg-white/5 border border-border-default">
              The browser will capture a frame from each video and replace its thumbnail.
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" size="md" type="button" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => void handleConfirm()}
                className="flex-1"
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="flex flex-col gap-3">
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${videos.length > 0 ? (progress / videos.length) * 100 : 0}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 size={14} className="animate-spin shrink-0" />
              <span>Processing… this may take a moment</span>
            </div>
          </div>
        )}

        {state === 'done' && (
          <div className="flex flex-col gap-4">
            <p
              className={[
                'text-sm px-3 py-3 rounded-lg border',
                failed === 0
                  ? 'text-text-secondary bg-white/5 border-border-default'
                  : 'text-red-400 bg-red-950/60 border-red-900/40',
              ].join(' ')}
            >
              {failed === 0
                ? `${succeeded} thumbnail${succeeded !== 1 ? 's' : ''} regenerated successfully.`
                : succeeded > 0
                ? `${succeeded} succeeded, ${failed} could not be processed.`
                : 'No thumbnails could be regenerated.'}
            </p>
            <Button variant="ghost" size="md" type="button" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
