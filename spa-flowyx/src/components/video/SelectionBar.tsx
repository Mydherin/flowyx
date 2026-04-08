import { Tag, Trash2, Share2, Download, FolderDown } from 'lucide-react'

interface SelectionBarProps {
  count: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onEditTags?: () => void
  onShare?: () => void
  onDelete?: () => void
  onAddToMine?: () => void
  onDownload?: () => void
}

export function SelectionBar({
  count,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onEditTags,
  onShare,
  onDelete,
  onAddToMine,
  onDownload,
}: SelectionBarProps) {
  const allSelected = count === totalCount && totalCount > 0

  return (
    // stopPropagation prevents document-level click listener from dismissing select mode
    <div
      className="fixed bottom-0 inset-x-0 z-40 bg-bg-secondary/95 backdrop-blur-md border-t border-border-default"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        {/* Left: count */}
        <span className="text-sm font-semibold text-white shrink-0 min-w-[4rem]">
          {count}
          <span className="text-text-muted font-normal"> selected</span>
        </span>

        {/* Center: icon-only action buttons. Destructive (delete) placed last. */}
        <div className="flex items-center gap-1">
          {onEditTags && (
            <ActionButton onClick={onEditTags} disabled={count === 0} title="Edit tags">
              <Tag size={20} />
            </ActionButton>
          )}
          {onShare && (
            <ActionButton onClick={onShare} disabled={count === 0} title="Share">
              <Share2 size={20} />
            </ActionButton>
          )}
          {onAddToMine && (
            <ActionButton onClick={onAddToMine} disabled={count === 0} title="Add to my videos">
              <FolderDown size={20} />
            </ActionButton>
          )}
          {onDownload && (
            <ActionButton onClick={onDownload} disabled={count === 0} title="Download">
              <Download size={20} />
            </ActionButton>
          )}
          {onDelete && (
            <ActionButton onClick={onDelete} disabled={count === 0} title="Delete" destructive>
              <Trash2 size={20} />
            </ActionButton>
          )}
        </div>

        {/* Right: select all toggle */}
        <button
          type="button"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-xs font-medium text-text-muted hover:text-white transition-colors shrink-0 min-w-[4rem] text-right"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
    </div>
  )
}

interface ActionButtonProps {
  onClick: () => void
  disabled: boolean
  title: string
  destructive?: boolean
  children: React.ReactNode
}

function ActionButton({ onClick, disabled, title, destructive = false, children }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        'p-2.5 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
        destructive
          ? 'text-text-muted hover:text-red-400 hover:bg-red-950/30 active:bg-red-950/50'
          : 'text-text-muted hover:text-white hover:bg-white/10 active:bg-white/15',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
