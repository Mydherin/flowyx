import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface UserRoleBadgeProps {
  role: string
  onChange: (newRole: 'USER' | 'ADMIN') => Promise<void>
  disabled?: boolean
}

export function UserRoleBadge({ role, onChange, disabled }: UserRoleBadgeProps) {
  const [pending, setPending] = useState(false)

  const toggle = async () => {
    if (disabled || pending) return
    const next = role === 'ADMIN' ? 'USER' : 'ADMIN'
    setPending(true)
    try {
      await onChange(next)
    } finally {
      setPending(false)
    }
  }

  const isAdmin = role === 'ADMIN'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void toggle()
      }}
      disabled={disabled || pending}
      title={pending ? 'Updating…' : `Click to set ${isAdmin ? 'USER' : 'ADMIN'}`}
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide transition-colors',
        isAdmin
          ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60'
          : 'bg-white/10 text-text-secondary hover:bg-white/20',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        pending ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {pending ? <Loader2 size={10} className="animate-spin" /> : null}
      {role}
    </button>
  )
}
