import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'blue' | 'mint' | 'amber' | 'rose' | 'slate' | 'violet'

const tones: Record<Tone, string> = {
  blue: 'border-brand-200 bg-brand-50 text-brand-700',
  mint: 'border-mint-200 bg-mint-50 text-mint-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  slate: 'border-ink-200 bg-ink-50 text-ink-600',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
}

const dots: Record<Tone, string> = {
  blue: 'bg-brand-500',
  mint: 'bg-mint-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-ink-400',
  violet: 'bg-violet-500',
}

export function Badge({
  children,
  tone = 'slate',
  dot,
  className,
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        tones[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className={cn('size-1.5 rounded-full', dots[tone])} /> : null}
      {children}
    </span>
  )
}
