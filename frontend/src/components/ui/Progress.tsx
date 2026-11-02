import { cn } from '@/lib/cn'

export function Progress({
  value,
  className,
  barClassName,
  label,
}: {
  value: number
  className?: string
  barClassName?: string
  label?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)}
    >
      <div
        className={cn('h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out', barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
