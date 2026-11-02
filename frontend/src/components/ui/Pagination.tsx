import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

function pageList(page: number, pages: number): (number | 'ellipsis')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const set = new Set([1, pages, page - 1, page, page + 1])
  const sorted = [...set].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push('ellipsis')
    result.push(value)
  })
  return result
}

export function Pagination({
  page,
  pages,
  onPageChange,
  total,
  pageSize,
  className,
}: {
  page: number
  pages: number
  onPageChange: (page: number) => void
  total?: number
  pageSize?: number
  className?: string
}) {
  if (pages <= 1 && !total) return null
  const start = total && pageSize ? (page - 1) * pageSize + 1 : null
  const end = total && pageSize ? Math.min(page * pageSize, total) : null

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-xs text-ink-500">
        {start && end && total ? (
          <>
            Showing <span className="font-semibold text-ink-700">{start}–{end}</span> of{' '}
            <span className="font-semibold text-ink-700">{total}</span>
          </>
        ) : (
          ' '
        )}
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink-500 transition hover:bg-ink-50 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pageList(page, Math.max(pages, 1)).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`e-${index}`} className="px-1.5 text-xs text-ink-400" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'size-9 rounded-lg text-xs font-semibold transition',
                item === page
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-transparent text-ink-500 hover:border-line hover:bg-white hover:text-ink-900',
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-ink-500 transition hover:bg-ink-50 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  )
}
