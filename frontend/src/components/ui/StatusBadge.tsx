import type { AppointmentStatus } from '@/api/types'
import { cn } from '@/lib/cn'
import { statusLabels, statusTone } from '@/lib/utils'
import { Badge } from './Badge'

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <Badge tone={statusTone[status]} dot className={cn('capitalize', className)}>
      {statusLabels[status]}
    </Badge>
  )
}
