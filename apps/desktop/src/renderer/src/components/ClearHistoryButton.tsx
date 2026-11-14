import { useState } from 'react'
import { cn } from '../lib/cn'
import { ResetIcon } from './Icons'
import { Button } from './ui/Button'

interface ClearHistoryButtonProps {
  count: number
  onClear: () => void
  className?: string
}

/** Two-step destructive action: no accidental history wipes. */
export function ClearHistoryButton({
  count,
  onClear,
  className
}: ClearHistoryButtonProps): React.JSX.Element {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const confirming = pendingCount === count && count > 0

  if (confirming) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="mr-1 text-[11px] font-medium text-stone-500">Clear {count}?</span>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            onClear()
            setPendingCount(null)
          }}
        >
          Clear
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPendingCount(null)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => setPendingCount(count)}
      disabled={count === 0}
      className={className}
    >
      <ResetIcon size={13} />
      Clear history
    </Button>
  )
}
