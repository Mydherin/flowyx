import { useEffect, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { userService } from '../../../services/userService'
import type { UserSearchResult } from '../../../types/sharing'

interface UserSearchInputProps {
  alreadySharedIds: Set<string>
  addingId: string | null
  onSelect: (user: UserSearchResult) => void
  onSearch?: (query: string) => Promise<UserSearchResult[]>
}

export function UserSearchInput({ alreadySharedIds, addingId, onSelect, onSearch }: UserSearchInputProps) {
  const searchFn = onSearch ?? userService.search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchFn(query.trim())
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = (user: UserSearchResult) => {
    onSelect(user)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div
        className={[
          'flex items-center gap-2 bg-bg-tertiary border rounded-lg px-3 py-2 transition-all',
          focused ? 'border-white/20 ring-1 ring-white/10' : 'border-border-default',
        ].join(' ')}
      >
        {loading ? (
          <Loader2 size={14} className="text-text-muted shrink-0 animate-spin" />
        ) : (
          <Search size={14} className="text-text-muted shrink-0" />
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true) }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150) }}
          placeholder="Search by nickname or email…"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-56 overflow-y-auto bg-bg-secondary border border-border-default rounded-lg shadow-2xl">
          {results.map((user) => {
            const alreadyAdded = alreadySharedIds.has(user.id)
            return (
              <button
                key={user.id}
                type="button"
                onMouseDown={() => !alreadyAdded && !addingId && handleSelect(user)}
                disabled={alreadyAdded || addingId !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                {user.pictureUrl ? (
                  <img src={user.pictureUrl} alt={user.nickname} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-xs text-text-muted font-medium">{user.nickname[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium truncate">{user.nickname}</p>
                  <p className="text-text-muted text-xs truncate">{user.email}</p>
                </div>
                {alreadyAdded ? (
                  <span className="text-text-muted text-xs shrink-0">Added</span>
                ) : (
                  <span className="text-blue-400 text-xs shrink-0">+ Add</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 bg-bg-secondary border border-border-default rounded-lg shadow-2xl px-3 py-3">
          <p className="text-text-muted text-sm text-center">No users found</p>
        </div>
      )}
    </div>
  )
}
