const THUMBNAIL_TIMEOUT_MS = 10_000
const TARGET_W = 640
const TARGET_H = 360

/**
 * Attempts a single thumbnail capture at the given seek position.
 * Includes a timeout so it never hangs (e.g. iCloud videos still downloading).
 */
function attemptCapture(file: File, seekSeconds: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    let settled = false
    const finish = (result: Blob | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      resolve(result)
    }

    const timer = setTimeout(() => finish(null), THUMBNAIL_TIMEOUT_MS)

    video.addEventListener('loadedmetadata', () => {
      if (!video.duration || !isFinite(video.duration)) { finish(null); return }
      video.currentTime = Math.min(seekSeconds, video.duration * 0.1)
    })

    video.addEventListener('seeked', () => {
      try {
        if (!video.videoWidth || !video.videoHeight) { finish(null); return }
        const canvas = document.createElement('canvas')
        const videoAspect = video.videoWidth / video.videoHeight
        const targetAspect = TARGET_W / TARGET_H
        let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight
        if (videoAspect > targetAspect) {
          sw = video.videoHeight * targetAspect
          sx = (video.videoWidth - sw) / 2
        } else {
          sh = video.videoWidth / targetAspect
          sy = (video.videoHeight - sh) / 2
        }
        canvas.width = TARGET_W
        canvas.height = TARGET_H
        const ctx = canvas.getContext('2d')
        if (!ctx) { finish(null); return }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H)
        canvas.toBlob(
          (blob) => finish(blob),
          'image/jpeg',
          0.8,
        )
      } catch {
        finish(null)
      }
    })

    video.addEventListener('error', () => finish(null))
    video.load()
  })
}

/**
 * Captures a JPEG thumbnail from a video file.
 * Retries once after a short delay if the first attempt fails — this handles
 * iCloud-backed videos that may not be fully available on the first try.
 */
export async function captureVideoThumbnail(file: File, maxAttempts = 2): Promise<Blob | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500))
    const blob = await attemptCapture(file, attempt === 0 ? 1 : 0.5)
    if (blob) return blob
  }
  return null
}
