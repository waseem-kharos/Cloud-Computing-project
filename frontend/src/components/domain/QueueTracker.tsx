import { BellRing, CheckCircle2, Clock3, DoorOpen, Radio, Users } from 'lucide-react'
import type { PublicQueue } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/cn'
import { formatDate, formatTime, waitLabel } from '@/lib/utils'

export function QueueTracker({ data, compact }: { data: PublicQueue; compact?: boolean }) {
  const { appointment, queue } = data
  const statusLine =
    appointment.status === 'in_progress'
      ? 'It is your turn'
      : appointment.status === 'completed'
        ? 'Visit completed'
        : appointment.status === 'cancelled'
          ? 'Appointment cancelled'
          : data.people_ahead === 0
            ? 'You are next'
            : `${data.people_ahead ?? '—'} ${data.people_ahead === 1 ? 'person' : 'people'} ahead of you`

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="mesh-dark relative px-5 py-4 text-white sm:px-6">
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
              <Radio aria-hidden className="size-3 text-mint-300" /> Live queue
            </p>
            <h3 className="mt-1.5 text-lg font-bold">{appointment.doctor_name}</h3>
            <p className="text-xs text-white/60">
              {appointment.department_name} · Room {appointment.room_number}
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur">
            {data.is_today ? 'Today' : formatDate(appointment.appointment_date)}
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
            <p className="text-[10px] font-medium text-white/50">Your number</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{appointment.queue_number ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
            <p className="text-[10px] font-medium text-white/50">Now serving</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-mint-300">{queue.current_number ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
            <p className="text-[10px] font-medium text-white/50">Est. wait</p>
            <p className="mt-1 text-lg font-bold">{waitLabel(data.estimated_wait_minutes)}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={appointment.status} />
            {appointment.status === 'in_progress' ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-700">
                <BellRing aria-hidden className="size-3.5" /> Please proceed to the room
              </span>
            ) : null}
          </div>
          <span className="text-xs text-ink-500">{statusLine}</span>
        </div>

        <Progress value={queue.progress} className="mt-3" label="Queue progress" barClassName="bg-mint-500" />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-400">
          <span>
            {queue.served} served · {queue.waiting} waiting
          </span>
          <span>
            {appointment.start_time && `Slot ${formatTime(appointment.start_time)}`} · {formatDate(appointment.appointment_date, 'dd MMM')}
          </span>
        </div>

        {!compact ? (
          <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-xs sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Users aria-hidden className="size-3.5 text-ink-400" />
              <div>
                <dt className="text-[10px] text-ink-400">People ahead</dt>
                <dd className="font-semibold text-ink-800">{data.people_ahead ?? '—'}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 aria-hidden className="size-3.5 text-ink-400" />
              <div>
                <dt className="text-[10px] text-ink-400">Average consult</dt>
                <dd className="font-semibold text-ink-800">{data.doctor.avg_consult_minutes} min</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DoorOpen aria-hidden className="size-3.5 text-ink-400" />
              <div>
                <dt className="text-[10px] text-ink-400">Room</dt>
                <dd className="font-semibold text-ink-800">{appointment.room_number}</dd>
              </div>
            </div>
          </dl>
        ) : null}

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
          <CheckCircle2 aria-hidden className="size-3.5 shrink-0 text-mint-500" />
          Updates automatically. Please arrive 10 minutes before your slot.
        </div>
      </div>
    </div>
  )
}

export function QueueSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line bg-white shadow-soft', className)}>
      <div className="h-36 animate-pulse bg-ink-200" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="h-2 w-full animate-pulse rounded bg-ink-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-ink-100" />
      </div>
    </div>
  )
}
