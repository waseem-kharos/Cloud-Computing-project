import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarClock, Clock3, FileText, MapPin, Stethoscope, UserRound, XCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { patientApi } from '@/api/endpoints'
import { RescheduleDialog } from '@/components/domain/RescheduleDialog'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useUtils'
import { formatDate, formatTime, fromNow } from '@/lib/utils'
import { useState } from 'react'

export function PatientAppointmentDetailPage() {
  useDocumentTitle('Appointment details')
  const { id } = useParams()
  const appointmentId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const appointment = useQuery({
    queryKey: ['patient-appointment', appointmentId],
    queryFn: () => patientApi.appointment(appointmentId),
    enabled: Number.isFinite(appointmentId),
  })

  const cancel = useMutation({
    mutationFn: () => patientApi.cancel(appointmentId),
    onSuccess: () => {
      toast({ title: 'Appointment cancelled' })
      queryClient.invalidateQueries({ queryKey: ['patient-appointment', appointmentId] })
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard'] })
      navigate('/patient/appointments')
    },
    onError: (error) => toast({ title: 'Could not cancel', description: getErrorMessage(error), tone: 'error' }),
  })

  if (appointment.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-ink-50" />
  if (appointment.isError || !appointment.data) {
    return <ErrorState title="Appointment not found" description={getErrorMessage(appointment.error)} onRetry={() => void appointment.refetch()} />
  }

  const a = appointment.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/patient/appointments" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700">
          <ArrowLeft className="size-4" /> Back to appointments
        </Link>
        <StatusBadge status={a.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Appointment details" description={`Reference ${a.reference}`} />
          <CardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={<Stethoscope className="size-4" />} label="Doctor" value={a.doctor_name} sub={a.doctor_designation} />
              <Info icon={<MapPin className="size-4" />} label="Department / Room" value={a.department_name} sub={`Room ${a.doctor_room}`} />
              <Info icon={<CalendarClock className="size-4" />} label="Date" value={formatDate(a.appointment_date)} />
              <Info icon={<Clock3 className="size-4" />} label="Time" value={`${formatTime(a.start_time)} - ${formatTime(a.end_time)}`} />
              <Info icon={<UserRound className="size-4" />} label="Patient" value={a.patient_name} sub={a.patient_phone || ''} />
              <Info icon={<FileText className="size-4" />} label="Queue number" value={a.queue_number ? `#${a.queue_number}` : '—'} />
            </div>
            {a.reason ? (
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-xs font-semibold text-ink-700">Reason</p>
                <p className="mt-1 text-sm text-ink-600">{a.reason}</p>
              </div>
            ) : null}
            {a.doctor_notes ? (
              <div className="rounded-xl bg-brand-50 p-4">
                <p className="text-xs font-semibold text-brand-700">Doctor notes</p>
                <p className="mt-1 text-sm text-brand-800">{a.doctor_notes}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <CardBody className="space-y-3">
            {['booked', 'checked_in'].includes(a.status) ? (
              <>
                <Button className="w-full" onClick={() => setOpen(true)}>
                  <CalendarClock className="size-4" /> Reschedule
                </Button>
                <Button variant="outline" className="w-full" loading={cancel.isPending} onClick={() => cancel.mutate()}>
                  <XCircle className="size-4" /> Cancel appointment
                </Button>
              </>
            ) : null}
            <Link to={`/track-queue?ref=${a.reference}`} className={buttonClasses('outline', 'md', 'w-full justify-center')}>
              Track queue
            </Link>
            <p className="text-xs text-ink-400">Created {fromNow(a.created_at)}</p>
          </CardBody>
        </Card>
      </div>

      <RescheduleDialog
        open={open}
        onClose={() => setOpen(false)}
        appointment={a}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-appointment', appointmentId] })
          queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
          queryClient.invalidateQueries({ queryKey: ['patient-dashboard'] })
        }}
      />
    </div>
  )
}

function Info({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line p-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="font-semibold text-ink-900">{value}</p>
        {sub ? <p className="text-xs text-ink-500">{sub}</p> : null}
      </div>
    </div>
  )
}
