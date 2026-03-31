import { Pencil, Trash2, Play } from 'lucide-react'
import type { Video } from '../../types/video'

const MAX_VISIBLE_TAGS = 3

interface VideoCardProps {
  video: Video
  onPlay: (video: Video) => void
  onEdit: (video: Video) => void
  onDelete: (id: string) => void
}

export function VideoCard({ video, onPlay, onEdit, onDelete }: VideoCardProps) {
  const visibleTags = video.tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenTags = video.tags.slice(MAX_VISIBLE_TAGS)

  return (
    // No overflow-hidden on the card so the tag tooltip can escape the bounds
    <div className="bg-bg-secondary border border-border-default rounded-xl group flex flex-col">
      {/* Thumbnail — overflow-hidden here clips to top rounded corners */}
      <button
        type="button"
        onClick={() => onPlay(video)}
        className="relative aspect-video bg-bg-tertiary block shrink-0 w-full rounded-t-xl overflow-hidden"
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.description || 'Video'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={28} className="text-text-muted" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <Play size={20} className="text-white translate-x-0.5" />
          </div>
        </div>
      </button>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {video.description && (
          <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
            {video.description}
          </p>
        )}

        {video.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="shrink-0 px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-text-muted text-xs"
              >
                {tag}
              </span>
            ))}
            {hiddenTags.length > 0 && (
              <div className="relative group/more shrink-0">
                <span className="cursor-default px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-text-muted text-xs select-none">
                  +{hiddenTags.length}
                </span>
                {/* Tooltip — appears above the chip */}
                <div className="absolute bottom-full left-0 mb-1.5 z-10 hidden group-hover/more:flex flex-wrap gap-1 p-2 bg-bg-secondary border border-border-default rounded-xl shadow-2xl w-44">
                  {hiddenTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-text-muted text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1 mt-auto">
          <button
            onClick={() => onEdit(video)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-text-muted hover:text-white hover:bg-white/5 text-xs transition-colors"
          >
            <Pencil size={11} />
            Edit
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-text-muted hover:text-red-400 hover:bg-red-950/40 text-xs transition-colors ml-auto"
          >
            <Trash2 size={11} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
