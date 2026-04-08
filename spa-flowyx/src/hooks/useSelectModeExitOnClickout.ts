import { useEffect } from 'react'

/**
 * Exits select mode on any click that does not originate from inside a
 * [data-keep-select] element (e.g. video cards, selection bar).
 *
 * Uses the capture phase so that stopPropagation() in child handlers
 * cannot block it — every click is seen, regardless of where it lands.
 */
export function useSelectModeExitOnClickout(isActive: boolean, onExit: () => void) {
  useEffect(() => {
    if (!isActive) return
    const handler = (e: MouseEvent) => {
      if ((e.target as Element).closest('[data-keep-select]')) return
      onExit()
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [isActive, onExit])
}
