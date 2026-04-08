import { useRef, useState } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  placeholder?: string
}

export function TagInput({ value, onChange, suggestions, placeholder = 'Add tags…' }: TagInputProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions
    .filter((s) => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase().trim()))

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && input.trim()) {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 bg-bg-tertiary border border-border-default rounded-lg px-2.5 py-2 min-h-[42px] focus-within:ring-1 focus-within:ring-white/20 transition-all cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white text-xs shrink-0"
          >
            {tag}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                removeTag(tag)
              }}
              className="text-white/50 hover:text-white transition-colors leading-none"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            const val = e.target.value
            if ((val.endsWith(',') || val.endsWith(' ')) && val.trim()) {
              addTag(val)
              return
            }
            setInput(val)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (input.trim()) addTag(input)
            setTimeout(() => setOpen(false), 120)
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-32 overflow-y-auto bg-bg-secondary border border-border-default rounded-lg shadow-2xl">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-white/5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-text-muted text-xs mt-1.5">Press Enter, comma, or space to add a tag</p>
    </div>
  )
}
