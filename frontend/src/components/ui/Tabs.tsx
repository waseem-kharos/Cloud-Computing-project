import { cn } from '@/lib/cn'

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  tabs: readonly { value: T; label: string; count?: number }[] | { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('scrollbar-thin flex gap-1 overflow-x-auto rounded-xl bg-ink-50 p-1', className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition',
            value === tab.value
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:bg-white/60 hover:text-ink-800',
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' ? (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                value === tab.value ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500',
              )}
            >
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
