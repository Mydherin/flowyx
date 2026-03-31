interface TagFilterProps {
  tags: string[]
  activeTags: string[]
  onChange: (tags: string[]) => void
}

export function TagFilter({ tags, activeTags, onChange }: TagFilterProps) {
  const toggle = (tag: string) => {
    onChange(
      activeTags.includes(tag) ? activeTags.filter((t) => t !== tag) : [...activeTags, tag],
    )
  }

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        <span className="text-text-muted text-xs font-medium uppercase tracking-wide shrink-0">
          Filter
        </span>

        {activeTags.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="shrink-0 text-xs text-text-muted hover:text-white transition-colors underline underline-offset-2"
          >
            Clear {activeTags.length > 1 ? `(${activeTags.length})` : ''}
          </button>
        )}

        {tags.map((tag) => {
          const active = activeTags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={[
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                active
                  ? 'bg-white text-black border-transparent'
                  : 'bg-transparent text-text-secondary border-border-default hover:border-white/30 hover:text-white',
              ].join(' ')}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Right fade hint */}
      <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none" />
    </div>
  )
}
