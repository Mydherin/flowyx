import { useEffect, useRef, useState } from 'react'
import { Tag, Search, X } from 'lucide-react'

interface TagFilterProps {
  tags: string[]
  activeTags: string[]
  onChange: (tags: string[]) => void
}

export function TagFilter({ tags, activeTags, onChange }: TagFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search.trim()
    ? tags.filter((t) => t.toLowerCase().includes(search.toLowerCase().trim()))
    : tags

  const toggle = (tag: string) => {
    onChange(activeTags.includes(tag) ? activeTags.filter((t) => t !== tag) : [...activeTags, tag])
  }

  const hasActive = activeTags.length > 0

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
          hasActive
            ? 'bg-white text-black border-transparent'
            : open
              ? 'bg-white/10 text-white border-transparent'
              : 'bg-transparent text-text-secondary border-border-default hover:border-white/30 hover:text-white',
        ].join(' ')}
      >
        <Tag size={12} />
        Tags
        {hasActive && (
          <span className="ml-0.5 bg-black/20 rounded-full px-1.5 py-px text-[10px] font-semibold leading-none">
            {activeTags.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-1.5 w-72 bg-bg-secondary border border-border-default rounded-xl shadow-2xl flex flex-col max-h-[60dvh]">
          {/* Search + clear row */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tags…"
                className="w-full bg-bg-tertiary border border-border-default rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
            {hasActive && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={11} />
                Clear
              </button>
            )}
          </div>

          {/* Tag grid */}
          <div className="flex flex-wrap gap-1.5 px-3 pb-3 flex-1 min-h-0 overflow-y-auto scrollbar-dark">
            {filtered.length === 0 ? (
              <p className="text-text-muted text-xs py-2 w-full text-center">No tags found</p>
            ) : (
              filtered.map((tag) => {
                const active = activeTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    className={[
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                      active
                        ? 'bg-white text-black border-transparent'
                        : 'bg-transparent text-text-secondary border-border-default hover:border-white/30 hover:text-white',
                    ].join(' ')}
                  >
                    {tag}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
