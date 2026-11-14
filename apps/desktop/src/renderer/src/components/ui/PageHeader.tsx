import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface PageHeaderProps {
  title: string
  description: string
  eyebrow?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow = 'Workspace',
  icon,
  action,
  className
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={cn('rise flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-amber-200/80 bg-brand-soft text-brand-ink">
            {icon}
          </span>
        ) : null}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            {eyebrow}
          </p>
          <h1 className="mt-0.5 text-[24px] font-bold leading-tight tracking-[-0.035em] text-ink">
            {title}
          </h1>
          <p className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-stone-500">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
