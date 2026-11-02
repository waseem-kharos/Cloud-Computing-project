import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Award,
  CalendarCheck2,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Languages,
  Loader2,
  MapPin,
  Stethoscope,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { publicApi } from '@/api/endpoints'
import { DepartmentIcon } from '@/components/domain/DepartmentIcon'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses, Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { WEEKDAYS } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { formatCurrency, formatTime, todayISO } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useUtils'

export function DoctorDetailPage() {
  const { id } = useParams()
  const doctorId = Number(id)
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('')

  const doctor = useQuery({
    queryKey: ['public-doctor', doctorId],
    queryFn: () => publicApi.doctor(doctorId),
    enabled: Number.isFinite(doctorId) && doctorId > 0,
  })

  useDocumentTitle(doctor.data?.full_name || 'Doctor profile')

  const slots = useQuery({
    queryKey: ['public-slots', doctorId, date],
    queryFn: () => publicApi.slots(doctorId, date),
    enabled: Boolean(doctor.data && date),
  })

  if (doctor.isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-4 w-32" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (doctor.isError || !doctor.data) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Doctor profile not found"
          description={doctor.error ? getErrorMessage(doctor.error) : 'This profile may no longer be available.'}
          onRetry={() => void doctor.refetch()}
        />
        <div className="mt-4 text-center">
          <Link to="/doctors" className={buttonClasses('outline', 'sm')}>
            <ArrowLeft className="size-3.5" /> Back to doctors
          </Link>
        </div>
      </div>
    )
  }

  const data = doctor.data
  const bookParams = new URLSearchParams({ doctor: String(data.id), date })
  if (time) bookParams.set('time', time)

  return (
    <div className="container-page py-8 sm:py-10">
      <Link to="/doctors" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-700">
        <ArrowLeft className="size-3.5" /> All doctors
      </Link>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
            <div className="mesh-dark relative px-5 py-6 text-white sm:px-7">
              <div className="relative flex flex-wrap items-start gap-4">
                <Avatar name={data.full_name} size="xl" className="ring-2 ring-white/20" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{data.full_name}</h1>
                    {data.is_active ? <Badge className="border-mint-400/20 bg-mint-400/10 text-mint-300" dot>Available</Badge> : <Badge tone="slate">Unavailable</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-white/70">
                    {data.designation} · {data.department.name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-white/55">
                    <span className="inline-flex items-center gap-1.5">
                      <Award className="size-3.5 text-mint-300" /> {data.experience_years} years experience
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-mint-300" /> Room {data.room_number}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Languages className="size-3.5 text-mint-300" /> {data.languages}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div>
                <h2 className="text-sm font-bold text-ink-900">About</h2>
                <p className="mt-2 text-[13px] leading-6 text-ink-500">{data.bio}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-line bg-ink-50/60 p-3.5">
                  <Wallet className="size-4 text-brand-500" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">Consultation</p>
                  <p className="mt-0.5 text-sm font-bold text-ink-900">{formatCurrency(data.consultation_fee)}</p>
                </div>
                <div className="rounded-xl border border-line bg-ink-50/60 p-3.5">
                  <Clock3 className="size-4 text-brand-500" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">Avg. consult</p>
                  <p className="mt-0.5 text-sm font-bold text-ink-900">{data.avg_consult_minutes} minutes</p>
                </div>
                <div className="rounded-xl border border-line bg-ink-50/60 p-3.5">
                  <Stethoscope className="size-4 text-brand-500" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">Department</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-ink-900">
                    <DepartmentIcon name={data.department.icon} className="size-3.5" /> {data.department.name}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                    <GraduationCap className="size-4 text-brand-500" /> Qualifications
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-ink-500">{data.qualifications}</p>
                </div>
                <div>
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                    <CalendarCheck2 className="size-4 text-brand-500" /> Clinic days
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {WEEKDAYS.filter((day) => data.availability.some((block) => block.day_of_week === day.value && block.is_active)).map((day) => (
                      <Badge key={day.value} tone="blue">
                        {day.short}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                <h2 className="text-xs font-bold text-brand-800">Weekly availability</h2>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {data.availability.length ? (
                    data.availability.map((block) => (
                      <div key={block.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[11px]">
                        <span className="font-semibold text-ink-700">{WEEKDAYS[block.day_of_week]?.label}</span>
                        <span className="text-ink-500">
                          {formatTime(block.start_time)} – {formatTime(block.end_time)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-ink-500">No published clinics. Please check back later.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ink-900">Book an appointment</h2>
            <p className="mt-1 text-xs leading-5 text-ink-500">Choose a date to see this doctor’s real published slots.</p>

            <div className="mt-5">
              <Input
                type="date"
                label="Appointment date"
                min={todayISO()}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value)
                  setTime('')
                }}
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[13px] font-semibold text-ink-700">Available times</p>
              {slots.isLoading ? (
                <div className="flex h-28 items-center justify-center rounded-xl border border-line bg-ink-50">
                  <Loader2 className="size-5 animate-spin text-brand-500" />
                </div>
              ) : slots.isError ? (
                <p className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-600">
                  {getErrorMessage(slots.error)}
                </p>
              ) : slots.data?.length ? (
                <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {slots.data.map((slot) => {
                    const selected = time === slot.start_time
                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        disabled={!slot.is_available}
                        onClick={() => setTime(slot.start_time)}
                        className={cn(
                          'rounded-lg border px-1.5 py-2.5 text-[11px] font-semibold transition',
                          selected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-line bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50',
                          !slot.is_available && 'cursor-not-allowed border-line bg-ink-50 text-ink-300 line-through',
                        )}
                      >
                        {formatTime(slot.start_time)}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-ink-50 p-5 text-center text-xs text-ink-500">
                  No published slots for this date. Try another day.
                </div>
              )}
            </div>

            <Link
              to={`/book?${bookParams.toString()}`}
              className={buttonClasses('primary', 'md', 'mt-5 w-full')}
              aria-disabled={!time}
              onClick={(event) => {
                if (!time) event.preventDefault()
              }}
            >
              <CalendarPlus className="size-4" /> {time ? `Continue with ${formatTime(time)}` : 'Choose a time'}
            </Link>

            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-400">
              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-mint-500" />
              You will confirm your details and reason on the next screen. Sign-in is required to complete a booking.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <p className="text-[11px] font-semibold text-ink-800">Need help choosing?</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-500">
              Browse <Link to="/departments" className="font-semibold text-brand-600 hover:underline">departments</Link> or{' '}
              <Link to="/contact" className="font-semibold text-brand-600 hover:underline">contact reception</Link>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
