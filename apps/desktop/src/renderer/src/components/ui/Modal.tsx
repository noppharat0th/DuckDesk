import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { CloseIcon } from '../Icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl'
} as const

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md'
}: ModalProps): React.JSX.Element | null {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    panelRef.current?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/35 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'rise relative w-full rounded-2xl border border-line bg-surface p-5 shadow-float focus:outline-none',
          SIZES[size]
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 grid size-7 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="Close dialog"
        >
          <CloseIcon size={14} />
        </button>

        <div className="pr-7">
          <h2 id={titleId} className="text-[16px] font-bold tracking-tight text-ink">
            {title}
          </h2>
          {description ? <p className="mt-1 text-[11px] text-stone-500">{description}</p> : null}
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
