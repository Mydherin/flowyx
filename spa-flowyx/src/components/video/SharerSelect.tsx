import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Sharer {
  id: string
  nickname: string | null
  pictureUrl: string | null
}

interface SharerSelectProps {
  sharers: Sharer[]
  selectedId: string | null
  onChange: (id: string) => void
}

export function SharerSelect({ sharers, selectedId, onChange }: SharerSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = sharers.find((s) => s.id === selectedId) ?? null

  const filtered = search.trim()
    ? sharers.filter((s) => s.nickname?.toLowerCase().includes(search.toLowerCase()))
    : sharers

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative inline-block" style={{ minWidth: '10rem', maxWidth: '18rem' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default bg-bg-secondary text-sm text-white hover:border-white/30 transition-colors"
      >
        <SharerAvatar sharer={selected} size={5} />
        <span className="flex-1 text-left truncate">{selected?.nickname ?? 'Select user'}</span>
        <ChevronDown size={14} className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[12rem] rounded-lg border border-border-default bg-bg-secondary shadow-xl overflow-hidden">
          {/* Search */}
          <div className="px-2 pt-2 pb-1">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-bg-primary border border-border-default text-white placeholder:text-text-muted focus:outline-none focus:border-white/40"
            />
          </div>

          {/* List */}
          <ul className="max-h-52 overflow-y-auto scrollbar-dark py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-text-muted">No results</li>
            ) : (
              filtered.map((sharer) => {
                const active = sharer.id === selectedId
                return (
                  <li key={sharer.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(sharer.id)}
                      className={[
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        active
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-text-secondary hover:bg-white/5 hover:text-white',
                      ].join(' ')}
                    >
                      <SharerAvatar sharer={sharer} size={5} />
                      <span className="truncate">{sharer.nickname ?? 'Unknown'}</span>
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

function SharerAvatar({ sharer, size }: { sharer: Sharer | null; size: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0`
  if (!sharer) return <div className={`${cls} bg-white/10`} />
  if (sharer.pictureUrl) {
    return <img src={sharer.pictureUrl} alt={sharer.nickname ?? ''} className={`${cls} object-cover`} />
  }
  return (
    <div className={`${cls} bg-white/10 flex items-center justify-center text-[10px] font-semibold text-white`}>
      {sharer.nickname?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}
