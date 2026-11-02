import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-400 ring-1 ring-line">
        <Icon aria-hidden className="size-6" />
      </span>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-ink-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Unable to load this page',
  description = 'Please check your connection and try again.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-rose-100 bg-rose-50/60 px-6 py-10 text-center', className)}>
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm ring-1 ring-rose-100">
        <AlertTriangle aria-hidden className="size-6" />
      </span>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-ink-500">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
