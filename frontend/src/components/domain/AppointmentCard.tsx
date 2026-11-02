import { CalendarClock, CalendarX2, ChevronRight, Clock, MapPin, RefreshCcw, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Appointment } from '@/api/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatTime, isActiveStatus } from '@/lib/utils'

export function AppointmentCard({
  appointment,
  onCancel,
  onReschedule,
  detailPath,
  compact,
}: {
  appointment: Appointment
  onCancel?: (appointment: Appointment) => void
  onReschedule?: (appointment: Appointment) => void
  detailPath?: string
  compact?: boolean
}) {
  const canManage = isActiveStatus(appointment.status) && (onCancel || onReschedule)
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-soft transition hover:border-ink-200 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-line bg-ink-50 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
              {formatDate(appointment.appointment_date, 'MMM')}
            </span>
            <span className="text-xl font-bold leading-tight text-ink-900">
              {formatDate(appointment.appointment_date, 'dd')}
            </span>
            <span className="text-[10px] text-ink-400">{formatDate(appointment.appointment_date, 'EEE')}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-ink-900">{appointment.doctor_name}</h3>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="mt-0.5 text-xs text-brand-600">
              {appointment.doctor_designation} · {appointment.department_name}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-500">
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden className="size-3" /> {formatTime(appointment.start_time)} –{' '}
                {formatTime(appointment.end_time)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-3" /> Room {appointment.doctor_room}
              </span>
              <span className="inline-flex items-center gap-1">
                <Stethoscope aria-hidden className="size-3" /> Ref {appointment.reference}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {appointment.queue_number ? (
            <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-1.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-brand-500">Queue</p>
              <p className="text-base font-bold leading-tight text-brand-700">{appointment.queue_number}</p>
            </div>
          ) : null}
          {detailPath ? (
            <Link
              to={detailPath}
              className="flex size-9 items-center justify-center rounded-lg border border-line text-ink-400 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
              aria-label={`View appointment ${appointment.reference}`}
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {appointment.reason ? (
        <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
          <span className="font-semibold text-ink-600">Reason:</span> {appointment.reason}
        </p>
      ) : null}

      {canManage ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
          {onReschedule ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(appointment)}
              icon={<RefreshCcw aria-hidden className="size-3.5" />}
            >
              Reschedule
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(appointment)}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              icon={<CalendarX2 aria-hidden className="size-3.5" />}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      ) : appointment.status === 'cancelled' ? (
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-ink-400">
          <CalendarX2 aria-hidden className="size-3.5" /> This appointment was cancelled
          {appointment.cancelled_reason ? ` — ${appointment.cancelled_reason}` : ''}
        </p>
      ) : appointment.status === 'completed' ? (
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-mint-600">
          <CalendarClock aria-hidden className="size-3.5" /> Visit completed
        </p>
      ) : null}
    </article>
  )
}

export function NextAppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-glow sm:p-6">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-6 size-32 rounded-full bg-white/5" />
      <div className="relative">
        <Badge className="border-white/20 bg-white/10 text-white">Next appointment</Badge>
        <div className="mt-4 flex items-start gap-3">
          <Avatar name={appointment.doctor_name} size="md" className="ring-white/30" />
          <div>
            <h3 className="text-base font-bold">{appointment.doctor_name}</h3>
            <p className="text-xs text-white/65">
              {appointment.doctor_designation} · {appointment.department_name}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
            <p className="text-[10px] text-white/50">Date</p>
            <p className="mt-0.5 font-semibold">{formatDate(appointment.appointment_date)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
            <p className="text-[10px] text-white/50">Time</p>
            <p className="mt-0.5 font-semibold">{formatTime(appointment.start_time)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs">
          <span className="text-white/60">Queue number</span>
          <span className="font-bold">{appointment.queue_number ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
