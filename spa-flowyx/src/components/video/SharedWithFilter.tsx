import { useEffect, useRef, useState } from 'react'
import { Users, Search, X } from 'lucide-react'
import type { ShareRecipient } from '../../types/video'

interface SharedWithFilterProps {
  recipients: ShareRecipient[]
  activeIds: string[]
  onChange: (ids: string[]) => void
}

export function SharedWithFilter({ recipients, activeIds, onChange }: SharedWithFilterProps) {
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
    ? recipients.filter((r) => r.nickname.toLowerCase().includes(search.toLowerCase().trim()))
    : recipients

  const toggle = (id: string) => {
    onChange(activeIds.includes(id) ? activeIds.filter((i) => i !== id) : [...activeIds, id])
  }

  const hasActive = activeIds.length > 0

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
        <Users size={12} />
        Shared with
        {hasActive && (
          <span className="ml-0.5 bg-black/20 rounded-full px-1.5 py-px text-[10px] font-semibold leading-none">
            {activeIds.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-1.5 w-64 bg-bg-secondary border border-border-default rounded-xl shadow-2xl overflow-hidden">
          {/* Search + clear row */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
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

          {/* User list */}
          <ul className="overflow-y-auto max-h-[100px] pb-2 scrollbar-dark">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-text-muted text-center">No results</li>
            ) : (
              filtered.map((recipient) => {
                const active = activeIds.includes(recipient.userId)
                return (
                  <li key={recipient.userId}>
                    <button
                      type="button"
                      onClick={() => toggle(recipient.userId)}
                      className={[
                        'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                        active
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-text-secondary hover:bg-white/5 hover:text-white',
                      ].join(' ')}
                    >
                      <RecipientAvatar recipient={recipient} />
                      <span className="truncate text-xs">{recipient.nickname}</span>
                      {active && (
                        <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function RecipientAvatar({ recipient }: { recipient: ShareRecipient }) {
  if (recipient.pictureUrl) {
    return (
      <img
        src={recipient.pictureUrl}
        alt={recipient.nickname}
        className="w-5 h-5 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-semibold text-white">
        {recipient.nickname[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
}
