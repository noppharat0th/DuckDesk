import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.45)] hover:bg-brand-strong disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none',
  secondary:
    'border border-line bg-white text-ink hover:border-line-strong hover:bg-canvas disabled:text-stone-400',
  ghost: 'text-ink-soft hover:bg-stone-100 hover:text-ink disabled:text-stone-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-stone-200 disabled:text-stone-400'
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1 rounded-md px-2.5 text-[11px]',
  md: 'h-9 gap-1.5 rounded-lg px-3 text-xs',
  lg: 'h-10 gap-1.5 rounded-lg px-4 text-[13px]',
  icon: 'size-9 rounded-lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
