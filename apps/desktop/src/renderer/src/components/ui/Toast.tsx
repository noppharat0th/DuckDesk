import { useEffect } from 'react'
import { InfoIcon } from '../Icons'

interface ToastProps {
  message: string | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps): React.JSX.Element | null {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, 3400)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      className="rise fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-ink px-3.5 py-2 text-[11px] font-medium text-white shadow-float"
      role="status"
    >
      <InfoIcon size={14} className="shrink-0 text-brand" />
      <span className="truncate">{message}</span>
    </div>
  )
}
