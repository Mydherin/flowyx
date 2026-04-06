import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import type { Video } from '../../types/video'
import { VideoGalleryCard } from './VideoGalleryCard'

interface VirtualizedVideoGridProps {
  videos: Video[]
  isSelectMode: boolean
  selectedIds: Set<string>
  onTap: (video: Video) => void
  onLongPress: (id: string) => void
  onToggleSelect: (id: string) => void
}

const GAP = 2 // gap-0.5 = 2px

function getColCount(width: number): number {
  if (width < 640) return 3
  if (width < 1024) return 4
  return 5
}

export function VirtualizedVideoGrid({
  videos,
  isSelectMode,
  selectedIds,
  onTap,
  onLongPress,
  onToggleSelect,
}: VirtualizedVideoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scrollMargin, setScrollMargin] = useState(0)

  // Track container width for responsive column count
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Re-measure scrollMargin after every render (cheap, fires before paint).
  // Handles filters/sharer-selector appearing above the grid and shifting its position.
  // Only triggers a re-render when the value actually changes.
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const measured = Math.round(rect.top + window.scrollY)
    setScrollMargin((prev) => (prev === measured ? prev : measured))
  })

  const cols = getColCount(containerWidth)
  const itemWidth = containerWidth > 0 ? (containerWidth - (cols - 1) * GAP) / cols : 0
  const itemHeight = itemWidth * (9 / 16) // aspect-video = 16:9
  const rowHeight = itemHeight + GAP

  const rows = useMemo(() => {
    const result: Video[][] = []
    for (let i = 0; i < videos.length; i += cols) {
      result.push(videos.slice(i, i + cols))
    }
    return result
  }, [videos, cols])

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    overscan: 1,
    scrollMargin,
  })

  // Render only the measuring anchor until ResizeObserver fires with real width
  if (containerWidth === 0) {
    return <div ref={containerRef} />
  }

  return (
    <div ref={containerRef}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowVideos = rows[virtualRow.index]
          const isLastRow = virtualRow.index === rows.length - 1
          const emptyCount = cols - rowVideos.length

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: `${GAP}px`,
                paddingBottom: isLastRow ? 0 : `${GAP}px`,
              }}
            >
              {rowVideos.map((video) => (
                <VideoGalleryCard
                  key={video.id}
                  video={video}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.has(video.id)}
                  onTap={() => onTap(video)}
                  onLongPress={() => onLongPress(video.id)}
                  onToggleSelect={() => onToggleSelect(video.id)}
                />
              ))}
              {emptyCount > 0 &&
                Array.from({ length: emptyCount }).map((_, i) => (
                  <div key={`filler-${i}`} className="aspect-video" />
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
