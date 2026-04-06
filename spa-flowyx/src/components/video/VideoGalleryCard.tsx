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

export function VideoGalleryCard({
  video,
  isSelectMode,
  isSelected,
  onTap,
  onLongPress,
  onToggleSelect,
}: VideoGalleryCardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPressRef = useRef(false)

  const startPress = () => {
    didLongPressRef.current = false
    timerRef.current = setTimeout(() => {
      didLongPressRef.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const handleClick = () => {
    if (didLongPressRef.current) return
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
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      onClick={(e) => { e.stopPropagation(); handleClick() }}
    >
      {/* Thumbnail */}
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.description || 'Video'}
          className="w-full h-full object-cover"
          draggable={false}
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
