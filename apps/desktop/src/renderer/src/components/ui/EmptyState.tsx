import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { DuckMark } from '../Brand'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  className
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-white/55 px-5 py-10 text-center',
        className
      )}
    >
      <DuckMark className="size-12" />
      <h3 className="mt-3 text-[13px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-stone-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
