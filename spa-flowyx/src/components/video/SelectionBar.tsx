import { Tag, Trash2, Share2, Download, FolderDown } from 'lucide-react'

interface SelectionBarProps {
  count: number
  onEditTags?: () => void
  onShare?: () => void
  onDelete?: () => void
  onAddToMine?: () => void
  onDownload?: () => void
}

export function SelectionBar({ count, onEditTags, onShare, onDelete, onAddToMine, onDownload }: SelectionBarProps) {
  return (
    // stopPropagation prevents document-level click listener from dismissing select mode
    <div
      className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-bg-secondary/95 backdrop-blur-md border-t border-border-default"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-text-secondary text-sm font-medium shrink-0">
        {count} selected
      </span>

      <div className="flex items-center gap-1">
        {onEditTags && (
          <button
            type="button"
            onClick={onEditTags}
            disabled={count === 0}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Edit tags"
          >
            <Tag size={18} />
            <span className="text-[10px]">Tags</span>
          </button>
        )}

        {onShare && (
          <button
            type="button"
            onClick={onShare}
            disabled={count === 0}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Share"
          >
            <Share2 size={18} />
            <span className="text-[10px]">Share</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={count === 0}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Delete"
          >
            <Trash2 size={18} />
            <span className="text-[10px]">Delete</span>
          </button>
        )}

        {onAddToMine && (
          <button
            type="button"
            onClick={onAddToMine}
            disabled={count === 0}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Add to my videos"
          >
            <Download size={18} />
            <span className="text-[10px]">Add to mine</span>
          </button>
        )}

        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            disabled={count === 0}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Download"
          >
            <FolderDown size={18} />
            <span className="text-[10px]">Download</span>
          </button>
        )}
      </div>

      {/* Spacer to balance the left count text */}
      <div className="w-20 shrink-0" />
    </div>
  )
}
