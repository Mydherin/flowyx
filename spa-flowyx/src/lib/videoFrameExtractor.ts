const SEEK_TIME_SECONDS = 1
const JPEG_QUALITY = 0.85
const TIMEOUT_MS = 10_000

/**
 * Uses the browser's native video decoder to capture a single JPEG frame.
 * Seeks to 1 second (or the first available frame for shorter videos).
 * No external dependencies — zero bundle size impact.
 *
 * Design notes:
 * - `settled` flag + `teardown` ensure the promise settles exactly once and all
 *   event listeners are removed before any cleanup runs. This prevents spurious
 *   `seeked` callbacks from being triggered by post-cleanup state changes.
 * - `video.src = ''` is enough to abort the in-flight download. We deliberately
 *   do NOT call `video.load()` after resolution: that resets seek position and
 *   can fire a second `seeked` event, which leaves a pending `canvas.toBlob()`
 *   in the browser's rendering queue and silently blocks future calls.
 * - `canvas.toBlob()` is wrapped in try/catch because it throws a synchronous
 *   `SecurityError` when the canvas is CORS-tainted. This happens when the same
 *   video URL was previously fetched without the `crossOrigin` attribute (e.g.
 *   by the in-app player), and the browser serves the cached response — which
 *   lacks CORS headers — to the `crossOrigin = 'anonymous'` request here.
 * - A 10-second timeout guards against `seeked` never firing (network stall,
 *   unsupported codec, or any other browser-level hang).
 */
export function extractVideoFrame(videoUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true

    let settled = false

    const settle = (action: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      teardown()
      action()
    }

    const teardown = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      // Setting src to '' aborts the in-flight download without firing extra events.
      // Do NOT call video.load() here — it resets seek state and can trigger a
      // spurious 'seeked' that leaves a permanently-pending canvas.toBlob() call.
      video.src = ''
    }

    const onLoadedMetadata = () => {
      const seekTo =
        isFinite(video.duration) && video.duration > SEEK_TIME_SECONDS
          ? SEEK_TIME_SECONDS
          : 0
      video.currentTime = seekTo
    }

    const onSeeked = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        settle(() => reject(new Error('Video dimensions unavailable at seek time')))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        settle(() => reject(new Error('Canvas 2D context unavailable')))
        return
      }

      ctx.drawImage(video, 0, 0)

      try {
        canvas.toBlob(
          (blob) => {
            if (blob) settle(() => resolve(blob))
            else settle(() => reject(new Error('Failed to capture frame from canvas')))
          },
          'image/jpeg',
          JPEG_QUALITY,
        )
      } catch (err) {
        // Thrown synchronously when the canvas is CORS-tainted — treat as a
        // recoverable per-video failure so the batch loop can continue.
        settle(() => reject(err instanceof Error ? err : new Error('Canvas export failed')))
      }
    }

    const onError = () => {
      settle(() => reject(new Error('Failed to load video for frame extraction')))
    }

    const timer = setTimeout(
      () => settle(() => reject(new Error('Video frame extraction timed out'))),
      TIMEOUT_MS,
    )

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })

    video.src = videoUrl
    video.load()
  })
}
