import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  PartyPopper,
  Stethoscope,
  Ticket,
  Wallet,
} from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { patientApi, publicApi } from '@/api/endpoints'
import type { Appointment, Department, Doctor } from '@/api/types'
import { DepartmentIcon } from '@/components/domain/DepartmentIcon'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/EmptyState'
import { Textarea } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/SectionHeading'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { formatCurrency, formatDate, formatTime, todayISO } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useUtils'

const steps = ['Department', 'Doctor', 'Date', 'Time', 'Review']

export function BookingPage() {
  useDocumentTitle('Book appointment')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const initialDoctorId = Number(params.get('doctor')) || null
  const initialDate = params.get('date') || todayISO()
  const initialTime = params.get('time') || ''

  const [step, setStep] = useState(initialDoctorId ? (initialTime ? 3 : 2) : 0)
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [doctorId, setDoctorId] = useState<number | null>(initialDoctorId)
  const [date, setDate] = useState(initialDate >= todayISO() ? initialDate : todayISO())
  const [time, setTime] = useState(initialTime)
  const [reason, setReason] = useState('')
  const [success, setSuccess] = useState<Appointment | null>(null)
  const initialized = useRef(false)

  const departments = useQuery({ queryKey: ['departments'], queryFn: publicApi.departments })
  const preselected = useQuery({
    queryKey: ['public-doctor', initialDoctorId],
    queryFn: () => publicApi.doctor(initialDoctorId!),
    enabled: Boolean(initialDoctorId),
  })

  const departmentsById = new Map<number, Department>((departments.data || []).map((item) => [item.id, item]))

  useEffect(() => {
    if (!preselected.data || initialized.current) return
    initialized.current = true
    setDepartmentId(preselected.data.department_id)
    setDoctorId(preselected.data.id)
    if (!params.get('date')) setDate(todayISO())
  }, [preselected.data, params])

  const doctors = useQuery({
    queryKey: ['booking-doctors', departmentId],
    queryFn: () => publicApi.doctors({ department_id: departmentId!, page_size: 50 }),
    enabled: Boolean(departmentId),
  })

  const slots = useQuery({
    queryKey: ['public-slots', doctorId, date],
    queryFn: () => publicApi.slots(doctorId!, date),
    enabled: Boolean(doctorId && date && step >= 2),
  })

  const booking = useMutation({
    mutationFn: () =>
      patientApi.book({
        doctor_id: doctorId!,
        appointment_date: date,
        start_time: time,
        reason: reason.trim() || undefined,
      }),
    onSuccess: (appointment) => {
      setSuccess(appointment)
      toast({ title: 'Appointment confirmed', description: `Queue number ${appointment.queue_number ?? 'assigned'} for ${formatDate(appointment.appointment_date)}.` })
      void queryClient.invalidateQueries({ queryKey: ['patient-dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      void queryClient.invalidateQueries({ queryKey: ['patient-queue'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => toast({ title: 'Booking failed', description: getErrorMessage(error), tone: 'error' }),
  })

  const selectedDoctor: Doctor | undefined = preselected.data?.id === doctorId ? preselected.data : doctors.data?.items.find((item) => item.id === doctorId)
  const selectedDepartment = departmentId ? departmentsById.get(departmentId) : undefined
  const days = Array.from({ length: 14 }, (_, index) => addDays(new Date(), index))

  function goToStep(next: number) {
    setStep(next)
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl py-8 sm:py-12">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
          <div className="mesh-dark px-6 py-9 text-center text-white sm:px-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-mint-400/15 text-mint-300 ring-1 ring-mint-400/20">
              <PartyPopper className="size-7" />
            </span>
            <h1 className="mt-4 text-2xl font-bold">You’re booked</h1>
            <p className="mt-1 text-sm text-white/60">Your appointment is confirmed. We have saved it to your dashboard.</p>
            <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] text-white/45">Queue number</p>
                <p className="mt-1 text-2xl font-bold text-mint-300">{success.queue_number ?? '—'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] text-white/45">Reference</p>
                <p className="mt-1 truncate text-sm font-bold">{success.reference}</p>
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/60 p-4">
              <Avatar name={success.doctor_name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-900">{success.doctor_name}</p>
                <p className="text-xs text-brand-600">{success.doctor_designation} · {success.department_name}</p>
                <p className="mt-1 text-[11px] text-ink-500">
                  {formatDate(success.appointment_date)} · {formatTime(success.start_time)} · Room {success.doctor_room}
                </p>
              </div>
              <Badge tone="mint" dot>Booked</Badge>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50 p-4 text-[11px] leading-5 text-brand-700">
              <CalendarCheck2 className="mt-0.5 size-4 shrink-0" />
              Please arrive 10 minutes early. Reception will check you in before your queue number becomes active.
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link to={`/patient/appointments/${success.id}`}>
                <Button className="w-full">View appointment</Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSuccess(null)
                  setStep(0)
                  setDepartmentId(null)
                  setDoctorId(null)
                  setTime('')
                  setReason('')
                  navigate('/book', { replace: true })
                }}
              >
                Book another
              </Button>
            </div>
            <div className="mt-3 text-center">
              <Link to="/patient" className="text-xs font-semibold text-ink-500 hover:text-brand-700">
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (initialDoctorId && preselected.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book an appointment"
        description="Choose a department, doctor and published time slot. You will review everything before confirming."
        action={
          <Link to="/patient" className="text-xs font-semibold text-ink-500 hover:text-brand-700">
            Cancel booking
          </Link>
        }
      />

      <div className="rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
        <ol className="scrollbar-thin flex items-center gap-1 overflow-x-auto">
          {steps.map((label, index) => {
            const done = index < step
            const active = index === step
            return (
              <li key={label} className="flex flex-1 items-center gap-1 min-w-fit">
                <button
                  type="button"
                  onClick={() => index < step && goToStep(index)}
                  disabled={index >= step}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition sm:px-2.5',
                    active && 'bg-brand-50 text-brand-700',
                    done && 'text-mint-700 hover:bg-mint-50',
                    !active && !done && 'text-ink-400',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px]',
                      done ? 'bg-mint-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400',
                    )}
                  >
                    {done ? <Check className="size-3" /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {index < steps.length - 1 ? <span className="h-px flex-1 bg-line" /> : null}
              </li>
            )
          })}
        </ol>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
          {step === 0 ? (
            <section>
              <h2 className="text-base font-bold text-ink-900">Choose a department</h2>
              <p className="mt-1 text-xs text-ink-500">Start with the type of care you need.</p>
              {departments.isLoading ? (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-ink-50" />
                  ))}
                </div>
              ) : departments.isError ? (
                <ErrorState className="mt-5" onRetry={() => void departments.refetch()} />
              ) : (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {departments.data?.map((department) => {
                    const selected = departmentId === department.id
                    return (
                      <button
                        key={department.id}
                        type="button"
                        onClick={() => {
                          setDepartmentId(department.id)
                          setDoctorId(null)
                          setTime('')
                          setStep(1)
                        }}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-3.5 text-left transition',
                          selected ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-brand-200 hover:bg-brand-50/30',
                        )}
                      >
                        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-500')}>
                          <DepartmentIcon name={department.icon} className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-ink-900">{department.name}</span>
                          <span className="mt-0.5 block text-[10px] leading-4 text-ink-500">
                            {department.doctor_count} {department.doctor_count === 1 ? 'doctor' : 'doctors'}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}

          {step === 1 ? (
            <section>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ink-900">Choose a doctor</h2>
                  <p className="mt-1 text-xs text-ink-500">{selectedDepartment?.name || 'Selected department'}</p>
                </div>
                <button type="button" onClick={() => setStep(0)} className="text-[11px] font-semibold text-brand-600 hover:underline">
                  Change department
                </button>
              </div>
              {doctors.isLoading ? (
                <div className="mt-5 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-ink-50" />
                  ))}
                </div>
              ) : doctors.data?.items.length ? (
                <div className="mt-5 space-y-2">
                  {doctors.data.items.map((doctor) => {
                    const selected = doctorId === doctor.id
                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          setDoctorId(doctor.id)
                          setTime('')
                          setStep(2)
                        }}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition',
                          selected ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-200 hover:bg-brand-50/30',
                        )}
                      >
                        <Avatar name={doctor.full_name} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-ink-900">{doctor.full_name}</span>
                            <Badge tone="blue">{doctor.experience_years} yrs</Badge>
                          </span>
                          <span className="mt-0.5 block text-[11px] text-brand-600">{doctor.designation}</span>
                          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-ink-500">
                            <span>{formatCurrency(doctor.consultation_fee)}</span>
                            <span>Room {doctor.room_number}</span>
                            <span>{doctor.languages}</span>
                          </span>
                        </span>
                        <ChevronRight className="mt-1 size-4 shrink-0 text-ink-300" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-line bg-ink-50 p-6 text-center text-xs text-ink-500">
                  No active doctors in this department. Please choose another.
                </div>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ink-900">Choose a date</h2>
                  <p className="mt-1 text-xs text-ink-500">{selectedDoctor?.full_name}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-[11px] font-semibold text-brand-600 hover:underline">
                  Change doctor
                </button>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {days.map((day) => {
                  const value = format(day, 'yyyy-MM-dd')
                  const selected = date === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setDate(value)
                        setTime('')
                        setStep(2)
                      }}
                      className={cn(
                        'rounded-xl border px-1 py-2.5 text-center transition',
                        selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50',
                      )}
                    >
                      <span className="block text-[9px] font-semibold uppercase tracking-wide opacity-70">{format(day, 'EEE')}</span>
                      <span className="mt-0.5 block text-base font-bold">{format(day, 'd')}</span>
                      <span className="block text-[9px] opacity-70">{format(day, 'MMM')}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-500">
                <CalendarDays className="size-3.5 text-brand-500" />
                Showing the next 14 days. Slots come from the doctor’s published schedule.
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => setStep(3)} trailingIcon={<ArrowRight className="size-4" />}>
                  Continue to times
                </Button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ink-900">Choose a time</h2>
                  <p className="mt-1 text-xs text-ink-500">{formatDate(date)} · {selectedDoctor?.full_name}</p>
                </div>
                <button type="button" onClick={() => setStep(2)} className="text-[11px] font-semibold text-brand-600 hover:underline">
                  Change date
                </button>
              </div>

              {slots.isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-brand-500" />
                </div>
              ) : slots.isError ? (
                <ErrorState className="mt-5" description={getErrorMessage(slots.error)} onRetry={() => void slots.refetch()} />
              ) : slots.data?.length ? (
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.data.map((slot) => {
                    const selected = time === slot.start_time
                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        disabled={!slot.is_available}
                        onClick={() => setTime(slot.start_time)}
                        className={cn(
                          'rounded-xl border px-2 py-3 text-xs font-semibold transition',
                          selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50',
                          !slot.is_available && 'cursor-not-allowed border-line bg-ink-50 text-ink-300 line-through hover:bg-ink-50',
                        )}
                      >
                        {formatTime(slot.start_time)}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-line bg-ink-50 p-6 text-center">
                  <Clock3 className="mx-auto size-5 text-ink-400" />
                  <p className="mt-2 text-xs text-ink-500">No slots published for this date.</p>
                  <button type="button" onClick={() => setStep(2)} className="mt-2 text-[11px] font-semibold text-brand-600 hover:underline">
                    Choose another date
                  </button>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-[10px] text-ink-400">Your queue number is assigned from slot order.</p>
                <Button onClick={() => setStep(4)} disabled={!time} trailingIcon={<ArrowRight className="size-4" />}>
                  Review appointment
                </Button>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <h2 className="text-base font-bold text-ink-900">Review and confirm</h2>
              <p className="mt-1 text-xs text-ink-500">Check the details before we hold your slot.</p>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/50 p-4">
                  <Avatar name={selectedDoctor?.full_name || 'Doctor'} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900">{selectedDoctor?.full_name}</p>
                    <p className="text-xs text-brand-600">{selectedDoctor?.designation}</p>
                    <p className="mt-1 text-[11px] text-ink-500">
                      {selectedDepartment?.name} · Room {selectedDoctor?.room_number}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-500">{formatCurrency(selectedDoctor?.consultation_fee || 0)} consultation</p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="text-[11px] font-semibold text-brand-600 hover:underline">
                    Change
                  </button>
                </div>

                <dl className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-line p-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Date</dt>
                    <dd className="mt-1 text-xs font-semibold text-ink-900">{formatDate(date, 'EEEE, dd MMM yyyy')}</dd>
                  </div>
                  <div className="rounded-xl border border-line p-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Time</dt>
                    <dd className="mt-1 text-xs font-semibold text-ink-900">
                      {time ? formatTime(time) : 'Not selected'}{' '}
                      <button type="button" onClick={() => setStep(3)} className="ml-1 text-[10px] font-semibold text-brand-600 hover:underline">
                        Change
                      </button>
                    </dd>
                  </div>
                </dl>

                <Textarea
                  label="Reason for visit (optional)"
                  placeholder="Briefly describe your concern. Do not include sensitive medical records."
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  hint={`${reason.length}/500 characters`}
                />

                {booking.isError ? (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                    {getErrorMessage(booking.error)}
                  </div>
                ) : null}

                <div className="rounded-xl bg-brand-50 p-4 text-[11px] leading-5 text-brand-700">
                  By confirming, you agree to arrive 10 minutes early. You can reschedule or cancel from your dashboard
                  while the appointment is active.
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  loading={booking.isPending}
                  disabled={!time}
                  onClick={() => booking.mutate()}
                  icon={<CheckCircle2 className="size-4" />}
                >
                  Confirm appointment
                </Button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Your selection</p>
            <div className="mt-3 space-y-3">
              <SummaryRow icon={<Stethoscope className="size-4" />} label="Department" value={selectedDepartment?.name || 'Not selected'} />
              <SummaryRow icon={<Avatar name={selectedDoctor?.full_name || ''} size="sm" />} label="Doctor" value={selectedDoctor?.full_name || 'Not selected'} />
              <SummaryRow icon={<CalendarDays className="size-4" />} label="Date" value={formatDate(date, 'dd MMM yyyy')} />
              <SummaryRow icon={<Clock3 className="size-4" />} label="Time" value={time ? formatTime(time) : 'Not selected'} />
              <SummaryRow icon={<Wallet className="size-4" />} label="Fee" value={selectedDoctor ? formatCurrency(selectedDoctor.consultation_fee) : '—'} />
              <SummaryRow icon={<MapPin className="size-4" />} label="Room" value={selectedDoctor?.room_number || '—'} />
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-soft p-4">
            <p className="text-[11px] font-bold text-amber-800">Demo booking</p>
            <p className="mt-1 text-[10px] leading-5 text-amber-700">
              This creates a real record in the local demo database with a synthetic doctor. No payment is collected.
            </p>
          </div>
        </aside>
      </div>

      {step > 0 ? (
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft className="size-3.5" /> Back
        </button>
      ) : null}
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="truncate text-[11px] font-semibold text-ink-800">{value}</p>
      </div>
    </div>
  )
}
