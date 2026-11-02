import { UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/utils'

const palettes = [
  'bg-brand-100 text-brand-700 ring-brand-200',
  'bg-mint-100 text-mint-700 ring-mint-200',
  'bg-violet-100 text-violet-700 ring-violet-200',
  'bg-amber-100 text-amber-700 ring-amber-200',
  'bg-rose-100 text-rose-700 ring-rose-200',
  'bg-cyan-100 text-cyan-700 ring-cyan-200',
]

const sizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-base',
  xl: 'size-20 text-xl',
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: keyof typeof sizes
  className?: string
}) {
  if (!name) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-ink-100 text-ink-500 ring-1 ring-line',
          sizes[size],
          className,
        )}
      >
        <UserRound aria-hidden className="size-1/2" />
      </span>
    )
  }

  const palette = palettes[name.charCodeAt(0) % palettes.length]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase ring-1',
        palette,
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
