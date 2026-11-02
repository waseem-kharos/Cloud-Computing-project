import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  loading,
  empty,
  mobileCard,
  onRowClick,
  className,
  rowClassName,
  caption,
  skeletonRows = 5,
}: {
  rows: T[]
  columns: Column<T>[]
  getRowKey: (row: T) => string | number
  loading?: boolean
  empty?: ReactNode
  mobileCard?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  className?: string
  rowClassName?: (row: T) => string | undefined
  caption?: string
  skeletonRows?: number
}) {
  if (loading) {
    return (
      <div className={cn('space-y-2 p-4', className)} aria-busy="true" aria-label="Loading table">
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!rows.length) {
    return <div className={className}>{empty}</div>
  }

  return (
    <div className={className}>
      {mobileCard ? (
        <div className="divide-y divide-line md:hidden">
          {rows.map((row) => (
            <div key={getRowKey(row)}>{mobileCard(row)}</div>
          ))}
        </div>
      ) : null}
      <div className={cn('scrollbar-thin overflow-x-auto', mobileCard && 'hidden md:block')}>
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line bg-ink-50/60">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500',
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-brand-50/40',
                  rowClassName?.(row),
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3.5 align-middle text-ink-700', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
