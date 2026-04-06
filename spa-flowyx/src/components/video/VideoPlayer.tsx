import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Loader2, Download, Check } from 'lucide-react'
import type { Video } from '../../types/video'
import { videoService } from '../../services/videoService'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoPlayerProps {
  videos: Video[]
  initialIndex: number
  onClose: () => void
}

interface ProgressBarProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  onDragStart: () => void
  onDragEnd: () => void
  onSeek: (ratio: number) => void
}

type Speed = 0.5 | 1 | 1.5
const SPEEDS: Speed[] = [0.5, 1, 1.5]
const SWIPE_THRESHOLD = 100  // px — past this, releasing commits navigation

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ videoRef, onDragStart, onDragEnd, onSeek }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const dragging = useRef(false)

  // RAF loop — writes directly to DOM at 60fps, bypasses React state
  useEffect(() => {
    const tick = () => {
      const v = videoRef.current
      const fill = fillRef.current
      const thumb = thumbRef.current
      if (v && fill && thumb && v.duration > 0) {
        const p = v.currentTime / v.duration
        fill.style.width = `${p * 100}%`
        thumb.style.left = `${p * 100}%`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [videoRef])

  const getRatio = (clientX: number): number => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    onDragStart()
    onSeek(getRatio(e.clientX))
    const onMouseMove = (e: MouseEvent) => { if (dragging.current) onSeek(getRatio(e.clientX)) }
    const onMouseUp = () => {
      dragging.current = false
      onDragEnd()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    dragging.current = true
    onDragStart()
    onSeek(getRatio(e.touches[0].clientX))
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation()
    if (dragging.current) onSeek(getRatio(e.touches[0].clientX))
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    dragging.current = false
    onDragEnd()
  }

  return (
    <div
      className="-my-2 py-2 cursor-pointer"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={barRef} className="relative h-1 bg-white/25 rounded-full group/bar">
        <div ref={fillRef} className="absolute left-0 top-0 h-full bg-white rounded-full" style={{ width: '0%' }} />
        <div
          ref={thumbRef}
          className="absolute top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white
                     opacity-0 scale-75 group-hover/bar:opacity-100 group-hover/bar:scale-100
                     transition-[opacity,transform] duration-150"
          style={{ left: '0%' }}
        />
      </div>
    </div>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

function useVideoPlayer(videos: Video[], initialIndex: number, onClose: () => void) {
  const [index, setIndex] = useState(initialIndex)
  const [paused, setPaused] = useState(true)
  const [loading, setLoading] = useState(true)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const [showSpeedPopover, setShowSpeedPopover] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Peek layer — the adjacent video's thumbnail that slides in behind the current video
  const peekRef = useRef<HTMLDivElement>(null)
  const peekImgRef = useRef<HTMLImageElement>(null)
  const peekFallbackRef = useRef<HTMLDivElement>(null)

  // Threshold indicators
  const leftIndicatorRef = useRef<HTMLDivElement>(null)
  const rightIndicatorRef = useRef<HTMLDivElement>(null)

  // Swipe state (all refs — no re-renders during gesture)
  const isDraggingProgressBar = useRef(false)
  const isCommitting = useRef(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchLockDir = useRef<'h' | 'v' | null>(null)
  const currentDragX = useRef(0)

  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = videos[index]

  // ── Controls auto-hide ──────────────────────────────────────────────────
  const resetControlsTimer = () => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }

  useEffect(() => {
    resetControlsTimer()
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // ── Src swap on index change ────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    setLoading(true)
    setPaused(true)
    setCurrentTime(0)
    setDuration(0)
    v.src = videos[index].videoUrl
    v.load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // ── Keep playback rate in sync ──────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed])

  // ── Close speed popover on outside click ───────────────────────────────
  useEffect(() => {
    if (!showSpeedPopover) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-speed-popover]')) setShowSpeedPopover(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showSpeedPopover])

  // ── Keyboard navigation ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate('prev')
      else if (e.key === 'ArrowRight') navigate('next')
      else if (e.key === 'Escape') onClose()
      else if (e.key === ' ') { e.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused])

  // ── Navigation ──────────────────────────────────────────────────────────
  const goTo = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= videos.length || newIndex === index || isCommitting.current) return
    setIndex(newIndex)
  }

  const navigate = (dir: 'prev' | 'next') => {
    goTo(dir === 'next' ? index + 1 : index - 1)
  }

  // ── Playback ────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current
    if (!v || loading) return
    if (v.paused) { v.play().catch(() => {}); setPaused(false) }
    else { v.pause(); setPaused(true) }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const seek = (ratio: number) => {
    const v = videoRef.current
    if (v && v.duration) v.currentTime = ratio * v.duration
  }

  const handleCanPlay = () => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = speed
    v.play().catch(() => {})
    // Don't hide spinner here — wait for 'playing' so the first frame is
    // actually rendered before the spinner disappears (no blank-frame flash).
  }

  const handlePlaying = () => {
    setLoading(false)
    setPaused(false)
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (v) setCurrentTime(v.currentTime)
  }

  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (v) setDuration(v.duration)
  }

  // ── Swipe gesture helpers ───────────────────────────────────────────────

  const setPeekContent = (peekIndex: number) => {
    const img = peekImgRef.current
    const fallback = peekFallbackRef.current
    if (!img || !fallback) return
    const thumb = videos[peekIndex]?.thumbnailUrl
    if (thumb) {
      img.src = thumb
      img.style.display = 'block'
      fallback.style.display = 'none'
    } else {
      img.style.display = 'none'
      fallback.style.display = 'block'
    }
  }

  const updateIndicators = (rawDx: number, progress: number) => {
    const confirmed = progress >= 1
    const bgColor = confirmed ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,0.5)'
    const iconColor = confirmed ? '#000' : '#fff'
    const borderColor = confirmed ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.6)'

    const applyToIndicator = (ref: React.RefObject<HTMLDivElement | null>) => {
      const el = ref.current
      if (!el) return
      el.style.opacity = `${Math.min(progress, 1)}`
      const offset = (1 - progress) * 20
      const side = ref === leftIndicatorRef ? offset : -offset
      el.style.transform = `translateY(-50%) translateX(${side}px) scale(${0.5 + progress * 0.5})`
      const inner = el.querySelector<HTMLElement>('.indicator-bg')
      const icon = el.querySelector<HTMLElement>('svg')
      if (inner) {
        inner.style.background = bgColor
        inner.style.borderColor = borderColor
      }
      if (icon) icon.style.color = iconColor
    }

    clearIndicators()
    if (rawDx > 0 && index > 0) applyToIndicator(leftIndicatorRef)
    else if (rawDx < 0 && index < videos.length - 1) applyToIndicator(rightIndicatorRef)
  }

  const clearIndicators = () => {
    ;[leftIndicatorRef, rightIndicatorRef].forEach((ref) => {
      const el = ref.current
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(-50%)'
      const inner = el.querySelector<HTMLElement>('.indicator-bg')
      const icon = el.querySelector<HTMLElement>('svg')
      if (inner) { inner.style.background = 'rgba(0,0,0,0.5)'; inner.style.borderColor = 'rgba(255,255,255,0.6)' }
      if (icon) icon.style.color = '#fff'
    })
  }

  const snapBack = () => {
    const spring = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    const vw = window.innerWidth
    const rawDx = currentDragX.current
    const peekStart = rawDx > 0 ? -vw : vw

    if (wrapperRef.current) {
      wrapperRef.current.style.transition = `transform 340ms ${spring}`
      wrapperRef.current.style.transform = 'translateX(0)'
    }
    if (peekRef.current) {
      peekRef.current.style.transition = `transform 340ms ${spring}, opacity 280ms ease`
      peekRef.current.style.transform = `translateX(${peekStart}px)`
      peekRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      if (wrapperRef.current) wrapperRef.current.style.transition = ''
      if (peekRef.current) {
        peekRef.current.style.transition = ''
        peekRef.current.style.transform = `translateX(${vw}px)`  // park off-screen
      }
    }, 360)
  }

  const commitSwipe = (rawDx: number, newIndex: number) => {
    isCommitting.current = true
    const vw = window.innerWidth
    const outX = rawDx > 0 ? vw : -vw
    const dur = 180

    if (wrapperRef.current) {
      wrapperRef.current.style.transition = `transform ${dur}ms ease-in`
      wrapperRef.current.style.transform = `translateX(${outX}px)`
    }
    if (peekRef.current) {
      peekRef.current.style.transition = `transform ${dur}ms ease-in, opacity ${dur}ms ease-in`
      peekRef.current.style.transform = 'translateX(0)'
      peekRef.current.style.opacity = '1'
    }

    setTimeout(() => {
      // Change video src — loading spinner will cover the reset
      setIndex(newIndex)
      // Reset both wrappers to their neutral positions (hidden behind spinner)
      if (wrapperRef.current) {
        wrapperRef.current.style.transition = ''
        wrapperRef.current.style.transform = ''
      }
      if (peekRef.current) {
        peekRef.current.style.transition = ''
        peekRef.current.style.transform = `translateX(${vw}px)`  // park off-screen
        peekRef.current.style.opacity = '0'
      }
      isCommitting.current = false
    }, dur + 10)
  }

  // ── Touch handlers ──────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDraggingProgressBar.current || isCommitting.current) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchLockDir.current = null
    currentDragX.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingProgressBar.current || isCommitting.current) return

    const rawDx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Lock direction after 10px movement
    if (!touchLockDir.current && Math.hypot(rawDx, dy) > 10) {
      touchLockDir.current = Math.abs(rawDx) > Math.abs(dy) ? 'h' : 'v'
      if (touchLockDir.current === 'h') {
        // Set peek content for the direction we're dragging toward
        const peekIndex = rawDx > 0 ? index - 1 : index + 1
        if (peekIndex >= 0 && peekIndex < videos.length) {
          setPeekContent(peekIndex)
        }
      }
    }
    if (touchLockDir.current !== 'h') return

    currentDragX.current = rawDx
    const vw = window.innerWidth
    const progress = Math.min(1.2, Math.abs(rawDx) / SWIPE_THRESHOLD)

    // Move current video with finger
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateX(${rawDx}px)`
    }

    // Slide peek in from the appropriate edge
    const peekStart = rawDx > 0 ? -vw : vw
    if (peekRef.current) {
      peekRef.current.style.transform = `translateX(${peekStart + rawDx}px)`
      peekRef.current.style.opacity = `${Math.min(progress * 0.9, 0.85)}`
    }

    // Update threshold indicators
    updateIndicators(rawDx, progress)
  }

  const handleTouchEnd = (_e: React.TouchEvent) => {
    if (isDraggingProgressBar.current || touchLockDir.current !== 'h' || isCommitting.current) return

    const rawDx = currentDragX.current
    const newIndex = rawDx > 0 ? index - 1 : index + 1
    const canNavigate = newIndex >= 0 && newIndex < videos.length

    clearIndicators()

    if (Math.abs(rawDx) >= SWIPE_THRESHOLD && canNavigate) {
      commitSwipe(rawDx, newIndex)
    } else {
      snapBack()
    }

    touchLockDir.current = null
    currentDragX.current = 0
  }

  return {
    videoRef,
    wrapperRef,
    peekRef,
    peekImgRef,
    peekFallbackRef,
    leftIndicatorRef,
    rightIndicatorRef,
    index,
    current,
    paused,
    loading,
    muted,
    speed,
    showSpeedPopover,
    showControls,
    currentTime,
    duration,
    isDraggingProgressBar,
    goTo,
    navigate,
    togglePlay,
    toggleMute,
    seek,
    setSpeed,
    setShowSpeedPopover,
    handleCanPlay,
    handlePlaying,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetControlsTimer,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VideoPlayer({ videos, initialIndex, onClose }: VideoPlayerProps) {
  const {
    videoRef,
    wrapperRef,
    peekRef,
    peekImgRef,
    peekFallbackRef,
    leftIndicatorRef,
    rightIndicatorRef,
    index,
    current,
    paused,
    loading,
    muted,
    speed,
    showSpeedPopover,
    showControls,
    currentTime,
    duration,
    isDraggingProgressBar,
    goTo,
    navigate,
    togglePlay,
    toggleMute,
    seek,
    setSpeed,
    setShowSpeedPopover,
    handleCanPlay,
    handlePlaying,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetControlsTimer,
  } = useVideoPlayer(videos, initialIndex, onClose)

  const ctrlClass = `transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`

  // ── Add to My Videos (shared videos only) ────────────────────────────────────
  const [cloningId, setCloningId] = useState<string | null>(null)
  const [clonedIds, setClonedIds] = useState<Set<string>>(new Set())

  const handleAddToMine = async (videoId: string) => {
    if (cloningId || clonedIds.has(videoId)) return
    setCloningId(videoId)
    try {
      await videoService.clone(videoId)
      setClonedIds((prev) => new Set(prev).add(videoId))
    } catch {
      // silently ignore — user can retry
    } finally {
      setCloningId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Peek layer — adjacent video thumbnail, slides in during swipe ── */}
      {/* Parked off-screen by default; translated imperatively during gesture */}
      <div
        ref={peekRef}
        className="absolute inset-0 flex items-center justify-center bg-neutral-950"
        style={{ opacity: 0, transform: `translateX(${window.innerWidth}px)` }}
      >
        {/* Thumbnail of adjacent video, shown when available */}
        <img
          ref={peekImgRef}
          alt=""
          className="w-full h-full object-contain opacity-70 blur-[2px]"
          style={{ display: 'none' }}
        />
        {/* Fallback when no thumbnail */}
        <div ref={peekFallbackRef} className="w-full h-full bg-neutral-900" style={{ display: 'none' }} />
      </div>

      {/* ── Current video wrapper ── */}
      <div
        ref={wrapperRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <video
          ref={videoRef}
          src={current.videoUrl}
          loop
          playsInline
          muted={muted}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="max-h-full max-w-full w-full h-full object-contain cursor-pointer"
        />
      </div>

      {/* ── Loading spinner ── */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Loader2 size={40} className="text-white/70 animate-spin" />
        </div>
      )}

      {/* ── Pause overlay ── */}
      {!loading && paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play size={32} className="text-white translate-x-1" />
          </div>
        </div>
      )}

      {/* ── Left swipe indicator (prev) ── */}
      <div
        ref={leftIndicatorRef}
        className="absolute left-4 top-1/2 z-20 pointer-events-none"
        style={{ opacity: 0, transform: 'translateY(-50%)' }}
      >
        <div
          className="indicator-bg w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm border-2"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.6)' }}
        >
          <ChevronLeft size={28} style={{ color: '#fff' }} />
        </div>
      </div>

      {/* ── Right swipe indicator (next) ── */}
      <div
        ref={rightIndicatorRef}
        className="absolute right-4 top-1/2 z-20 pointer-events-none"
        style={{ opacity: 0, transform: 'translateY(-50%)' }}
      >
        <div
          className="indicator-bg w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm border-2"
          style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.6)' }}
        >
          <ChevronRight size={28} style={{ color: '#fff' }} />
        </div>
      </div>

      {/* ── Top bar ── */}
      <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-8
                       bg-linear-to-b from-black/70 to-transparent z-10 ${ctrlClass}`}>
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

        {/* Add to My Videos — only shown for shared videos */}
        {current.sharedByUserId && (
          <button
            onClick={(e) => { e.stopPropagation(); void handleAddToMine(current.id) }}
            disabled={!!cloningId}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10
                       text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add to my videos"
          >
            {clonedIds.has(current.id) ? (
              <>
                <Check size={13} className="text-green-400" />
                <span className="text-green-400">Added</span>
              </>
            ) : cloningId === current.id ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Adding…</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Add to my videos</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Left / Right nav arrows (desktop) ── */}
      {index > 0 && (
        <button
          onClick={() => navigate('prev')}
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 z-10
                      flex items-center justify-center rounded-full
                      bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10
                      ${ctrlClass} ${showControls ? 'translate-x-0' : '-translate-x-2'} transition-[opacity,transform] duration-300`}
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
      )}
      {index < videos.length - 1 && (
        <button
          onClick={() => navigate('next')}
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 z-10
                      flex items-center justify-center rounded-full
                      bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10
                      ${ctrlClass} ${showControls ? 'translate-x-0' : 'translate-x-2'} transition-[opacity,transform] duration-300`}
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      )}

      {/* ── Bottom controls ── */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 px-4 pt-12 pb-6
                       bg-linear-to-t from-black/90 via-black/50 to-transparent ${ctrlClass}`}>

        {/* Description & tags */}
        {(current.description || current.tags.length > 0) && (
          <div className="mb-3">
            {current.description && (
              <p className="text-white/80 text-sm leading-snug line-clamp-2 mb-1.5">
                {current.description}
              </p>
            )}
            {current.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {current.tags.map((tag) => (
                  <span key={tag} className="text-white/60 text-xs">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls row: play/pause | time | progress bar | speed | mute */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={togglePlay}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-colors"
          >
            {paused
              ? <Play size={15} className="text-white translate-x-0.5" />
              : <Pause size={15} className="text-white" />}
          </button>

          <span className="text-white/50 text-xs tabular-nums shrink-0">
            {formatTime(currentTime)}
            {duration > 0 && <> / {formatTime(duration)}</>}
          </span>

          <div className="flex-1 min-w-0">
            <ProgressBar
              videoRef={videoRef}
              onDragStart={() => { isDraggingProgressBar.current = true }}
              onDragEnd={() => { isDraggingProgressBar.current = false }}
              onSeek={seek}
            />
          </div>

          {/* Speed popover */}
          <div className="relative shrink-0" data-speed-popover>
            <button
              onClick={(e) => { e.stopPropagation(); setShowSpeedPopover(p => !p) }}
              className="h-7 px-2.5 flex items-center justify-center rounded-full text-xs font-medium
                         bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10
                         text-white tabular-nums transition-colors min-w-11"
            >
              {speed}×
            </button>
            {showSpeedPopover && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                              flex flex-col gap-1 p-1.5 rounded-xl
                              bg-black/80 backdrop-blur-md border border-white/10">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); setSpeed(s); setShowSpeedPopover(false) }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium tabular-nums transition-colors
                                ${s === speed ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleMute}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full
                       bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-colors"
          >
            {muted ? <VolumeX size={14} className="text-white" /> : <Volume2 size={14} className="text-white" />}
          </button>
        </div>
      </div>

      {/* ── Dot indicators ── */}
      {videos.length > 1 && videos.length <= 12 && (
        <div className={`absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 ${ctrlClass}`}>
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-200 ${i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`}
            />
          ))}
        </div>
      )}

      {/* ── Adjacent video preload (metadata only — a few KB) ── */}
      {index > 0 && (
        <video key={`pre-${index - 1}`} src={videos[index - 1].videoUrl} preload="metadata" className="hidden" />
      )}
      {index < videos.length - 1 && (
        <video key={`pre-${index + 1}`} src={videos[index + 1].videoUrl} preload="metadata" className="hidden" />
      )}
    </div>
  )
}
