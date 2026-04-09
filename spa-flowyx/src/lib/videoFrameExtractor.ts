const SEEK_TIME_SECONDS = 1
const JPEG_QUALITY = 0.85

/**
 * Uses the browser's native video decoder to capture a single JPEG frame.
 * Seeks to 1 second (or the first available frame for shorter videos).
 * No external dependencies — zero bundle size impact.
 */
export function extractVideoFrame(videoUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true

    const cleanup = () => {
      video.src = ''
      video.load()
    }

    video.onloadedmetadata = () => {
      const seekTo =
        isFinite(video.duration) && video.duration > SEEK_TIME_SECONDS
          ? SEEK_TIME_SECONDS
          : 0
      video.currentTime = seekTo
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        cleanup()
        reject(new Error('Canvas 2D context unavailable'))
        return
      }

      ctx.drawImage(video, 0, 0)

      canvas.toBlob(
        (blob) => {
          cleanup()
          if (blob) resolve(blob)
          else reject(new Error('Failed to capture frame from canvas'))
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Failed to load video for frame extraction'))
    }

    video.src = videoUrl
    video.load()
  })
}
