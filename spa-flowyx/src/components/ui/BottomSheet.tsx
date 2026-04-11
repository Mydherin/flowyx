import type { ReactNode } from 'react'

interface BottomSheetProps {
  /** Called when the backdrop is clicked. Pass undefined to disable backdrop-close. */
  onBackdropClick?: () => void
  /** Tailwind max-width class for the sheet card. Defaults to sm:max-w-md. */
  maxWidth?: string
  /** Tailwind max-height class for the sheet card. Defaults to max-h-[85dvh]. */
  maxHeight?: string
  children: ReactNode
}

/**
 * Bottom-sheet modal shell.
 * On mobile: slides up from the bottom with rounded top corners.
 * On sm+: centered dialog with rounded corners.
 * Automatically clears the iOS home indicator (pb-safe) in one place.
 */
export function BottomSheet({
  onBackdropClick,
  maxWidth = 'sm:max-w-md',
  maxHeight = 'max-h-[85dvh]',
  children,
}: BottomSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onBackdropClick} />
      <div
        className={`relative w-full ${maxWidth} bg-bg-secondary border-0 sm:border sm:border-border-default rounded-t-2xl sm:rounded-2xl flex flex-col ${maxHeight} pb-safe`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
