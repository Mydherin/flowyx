import { useRef } from 'react'
import { Play, Users, Check } from 'lucide-react'
import type { Video } from '../../types/video'

interface VideoGalleryCardProps {
  video: Video
  isSelectMode: boolean
  isSelected: boolean
  onTap: () => void
  onLongPress: () => void
  onToggleSelect: () => void
}

const LONG_PRESS_MS = 500
const SCROLL_THRESHOLD = 8

export function VideoGalleryCard({
  video,
  isSelectMode,
  isSelected,
  onTap,
  onLongPress,
  onToggleSelect,
}: VideoGalleryCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set to true when the long-press timer fires — prevents the subsequent
  // touchend or click from being treated as a tap.
  const isLongPressRef = useRef(false)
  // Set to true when touchend handles the tap — prevents the synthetic
  // click event (synthesized by iOS/Android after touch) from double-firing.
  const touchHandledRef = useRef(false)
  // Set to true when the touch moved beyond SCROLL_THRESHOLD — prevents
  // touchend from firing a tap action at the end of a scroll gesture.
  const didScrollRef = useRef(false)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // ── Touch ──────────────────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    // Reset per-interaction flags on every new touch
    isLongPressRef.current = false
    touchHandledRef.current = false
    didScrollRef.current = false

    // Always track start position so handleTouchMove can detect scroll in any mode
    const t = e.changedTouches[0]
    touchStartPos.current = { x: t.clientX, y: t.clientY }

    if (isSelectMode) return // no long-press detection needed in select mode

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartPos.current.x
    const dy = t.clientY - touchStartPos.current.y
    if (Math.sqrt(dx * dx + dy * dy) > SCROLL_THRESHOLD) {
      clearTimer()
      didScrollRef.current = true
    }
  }

  const handleTouchEnd = () => {
    touchStartPos.current = null
    clearTimer()

    // Skip if this touch became a long-press or a scroll gesture
    if (isLongPressRef.current || didScrollRef.current) return

    // Act on the tap here directly, before the browser synthesizes a click event.
    // Mark as handled so the synthetic click (see handleClick) is a no-op.
    touchHandledRef.current = true
    if (isSelectMode) {
      onToggleSelect()
    } else {
      onTap()
    }
  }

  // ── Mouse (desktop only) ──────────────────────────────────────────────────

  const handleMouseDown = () => {
    if (isSelectMode) return // in select mode, click handles the toggle
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }

  // onClick fires for mouse clicks and for the synthetic click after touch.
  // Touch taps are already handled in touchEnd — skip them here.
  const handleClick = () => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }
    if (isSelectMode) {
      onToggleSelect()
    } else {
      onTap()
    }
  }

  return (
    <button
      type="button"
      className={[
        'relative aspect-video w-full overflow-hidden rounded-sm bg-bg-tertiary',
        'focus:outline-none select-none',
        'transition-transform duration-100 active:scale-[0.97]',
        isSelected ? 'ring-2 ring-blue-500 ring-inset' : '',
      ].join(' ')}
      data-keep-select="true"
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={handleMouseDown}
      onMouseUp={clearTimer}
      onMouseLeave={clearTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={(e) => { e.stopPropagation(); handleClick() }}
    >
      {/* Thumbnail */}
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.description || 'Video'}
          className="w-full h-full object-cover"
          draggable={false}
          // Prevent iOS long-press image callout (Save Image / Open in Browser)
          style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Play size={20} className="text-text-muted" />
        </div>
      )}

      {/* Bottom gradient overlay */}
      {(video.description || video.tags.length > 0) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1.5 px-1.5">
          {video.description && (
            <p className="text-white text-[10px] leading-tight line-clamp-1 font-medium">
              {video.description}
            </p>
          )}
          {video.tags.length > 0 && (
            <p className="text-white/50 text-[9px] mt-0.5">{video.tags.length} tag{video.tags.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Top-left: New badge for unseen shared videos */}
      {video.isNew && !isSelectMode && (
        <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-blue-500 text-white leading-none">
          New
        </span>
      )}

      {/* Top-right indicator: share badge OR selection checkbox */}
      {isSelectMode ? (
        <div
          className={[
            'absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-blue-500 border-blue-500'
              : 'bg-black/40 border-white/60',
          ].join(' ')}
        >
          {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
        </div>
      ) : video.isOwner && video.sharedWithCount > 0 ? (
        <div className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
          <Users size={10} className="text-white/80" />
        </div>
      ) : null}

      {/* Selected dim overlay */}
      {isSelectMode && !isSelected && (
        <div className="absolute inset-0 bg-black/30" />
      )}
    </button>
  )
}
