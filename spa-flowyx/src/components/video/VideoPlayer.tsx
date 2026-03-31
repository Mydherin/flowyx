import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import type { Video } from '../../types/video'

interface VideoPlayerProps {
  videos: Video[]
  initialIndex: number
  onClose: () => void
}

export function VideoPlayer({ videos, initialIndex, onClose }: VideoPlayerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartX = useRef(0)

  const current = videos[index]

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }

  useEffect(() => {
    resetControlsTimer()
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
  }, [index])

  // Auto-play on index change
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.play().catch(() => {})
    setPaused(false)
  }, [index])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
      else if (e.key === ' ') { e.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused])

  const prev = () => { if (index > 0) setIndex((i) => i - 1) }
  const next = () => { if (index < videos.length - 1) setIndex((i) => i + 1) }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play().catch(() => {}); setPaused(false) }
    else { v.pause(); setPaused(true) }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 60) {
      if (diff > 0) next()
      else prev()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video */}
      <video
        ref={videoRef}
        key={current.videoUrl}
        src={current.videoUrl}
        loop
        autoPlay
        playsInline
        muted={muted}
        onClick={togglePlay}
        className="max-h-full max-w-full w-full h-full object-contain cursor-pointer"
      />

      {/* Pause indicator flash */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play size={32} className="text-white translate-x-1" />
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        className={[
          'absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-8',
          'bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          <span className="text-white/70 text-sm font-medium tabular-nums">
            {index + 1} / {videos.length}
          </span>
        </div>
        <button
          onClick={toggleMute}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
        >
          {muted ? (
            <VolumeX size={16} className="text-white" />
          ) : (
            <Volume2 size={16} className="text-white" />
          )}
        </button>
      </div>

      {/* Left nav */}
      {index > 0 && (
        <button
          onClick={prev}
          className={[
            'absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12',
            'flex items-center justify-center rounded-full',
            'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10',
            'transition-all duration-300',
            showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2',
          ].join(' ')}
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      )}

      {/* Right nav */}
      {index < videos.length - 1 && (
        <button
          onClick={next}
          className={[
            'absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12',
            'flex items-center justify-center rounded-full',
            'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10',
            'transition-all duration-300',
            showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2',
          ].join(' ')}
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      )}

      {/* Bottom info */}
      <div
        className={[
          'absolute bottom-0 left-0 right-0 px-4 pt-16 pb-6',
          'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
          'transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            {current.description && (
              <p className="text-white/80 text-sm leading-snug line-clamp-2 mb-1.5">
                {current.description}
              </p>
            )}
            {current.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {current.tags.map((tag) => (
                  <span key={tag} className="text-white/60 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={togglePlay}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-colors"
          >
            {paused ? (
              <Play size={16} className="text-white translate-x-0.5" />
            ) : (
              <Pause size={16} className="text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Dot indicators for small number of videos */}
      {videos.length > 1 && videos.length <= 12 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={[
                'rounded-full transition-all duration-200',
                i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
