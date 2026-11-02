import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

const tones = {
  brand: {
    icon: 'bg-brand-50 text-brand-600 ring-brand-100',
    glow: 'bg-brand-100/70',
    stripe: 'bg-brand-500',
  },
  mint: {
    icon: 'bg-mint-50 text-mint-600 ring-mint-100',
    glow: 'bg-mint-100/70',
    stripe: 'bg-mint-500',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 ring-amber-100',
    glow: 'bg-amber-100/70',
    stripe: 'bg-amber-500',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 ring-rose-100',
    glow: 'bg-rose-100/70',
    stripe: 'bg-rose-500',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 ring-violet-100',
    glow: 'bg-violet-100/70',
    stripe: 'bg-violet-500',
  },
  ink: {
    icon: 'bg-ink-100 text-ink-600 ring-ink-200',
    glow: 'bg-ink-100',
    stripe: 'bg-ink-500',
  },
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  className,
}: {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <div
      className={cn(
        'group relative isolate overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      <span className={cn('absolute -right-7 -top-8 -z-10 size-28 rounded-full opacity-55 transition-transform duration-300 group-hover:scale-125', tones[tone].glow)} aria-hidden />
      <span className={cn('absolute inset-y-0 left-0 w-1', tones[tone].stripe)} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-ink-950">{value}</p>
          {hint ? <p className="mt-1 text-[11px] text-ink-400">{hint}</p> : null}
        </div>
        <span className={cn('flex size-10 items-center justify-center rounded-xl ring-1', tones[tone].icon)}>
          <Icon aria-hidden className="size-5" />
        </span>
      </div>
    </div>
  )
}
