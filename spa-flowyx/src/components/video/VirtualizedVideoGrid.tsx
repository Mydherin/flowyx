import { VirtuosoGrid } from 'react-virtuoso'
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

export function VirtualizedVideoGrid({
  videos,
  isSelectMode,
  selectedIds,
  onTap,
  onLongPress,
  onToggleSelect,
}: VirtualizedVideoGridProps) {
  return (
    <VirtuosoGrid
      useWindowScroll
      totalCount={videos.length}
      overscan={400}
      computeItemKey={(index) => videos[index].id}
      listClassName="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-0.5"
      itemContent={(index) => {
        const video = videos[index]
        return (
          <VideoGalleryCard
            video={video}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(video.id)}
            onTap={() => onTap(video)}
            onLongPress={() => onLongPress(video.id)}
            onToggleSelect={() => onToggleSelect(video.id)}
          />
        )
      }}
    />
  )
}
