import { Activity } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Logo({
  className,
  variant = 'dark',
  compact,
}: {
  className?: string
  variant?: 'dark' | 'light'
  compact?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/25">
        <Activity aria-hidden className="size-5" strokeWidth={2.4} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-mint-400" />
      </span>
      {!compact ? (
        <span className={cn('text-[19px] font-bold tracking-tight', variant === 'light' ? 'text-white' : 'text-ink-900')}>
          Medi<span className="text-brand-600">Queue</span>
        </span>
      ) : null}
    </span>
  )
}
