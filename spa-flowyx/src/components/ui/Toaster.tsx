import { useToastStore } from '../../stores/useToastStore'

/**
 * Renders active toasts at the top-center of the viewport.
 * Mount once in AppLayout — no props needed.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-x-0 z-[60] flex flex-col items-center gap-2 pointer-events-none px-4" style={{ top: 'calc(1rem + var(--sat))' }}>
      {toasts.map((t) => (
        <div key={t.id} className="animate-toast-in bg-bg-secondary border border-border-default text-text-primary text-sm px-4 py-2.5 rounded-full shadow-lg">
          {t.message}
        </div>
      ))}
    </div>
  )
}
