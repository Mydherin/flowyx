/**
 * Captures a JPEG thumbnail from a video file by seeking to ~10% of its duration.
 * Returns null if capture fails (e.g. codec not supported in browser).
 */
export async function captureVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.src = url
    video.muted = true
    video.playsInline = true

    const cleanup = () => URL.revokeObjectURL(url)

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(1, video.duration * 0.1)
    })

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        const TARGET_W = 640
        const TARGET_H = 360
        const videoAspect = video.videoWidth / (video.videoHeight || 1)
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
        if (!ctx) { cleanup(); resolve(null); return }
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H)
        canvas.toBlob(
          (blob) => { cleanup(); resolve(blob) },
          'image/jpeg',
          0.8,
        )
      } catch {
        cleanup()
        resolve(null)
      }
    })

    video.addEventListener('error', () => { cleanup(); resolve(null) })
    video.load()
  })
}
