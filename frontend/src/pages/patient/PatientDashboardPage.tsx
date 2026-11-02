import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  CheckCircle2,
  Clock3,
  Radio,
  Stethoscope,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { patientApi } from '@/api/endpoints'
import { AppointmentCard, NextAppointmentCard } from '@/components/domain/AppointmentCard'
import { QueueTracker } from '@/components/domain/QueueTracker'
import { StatCard } from '@/components/domain/StatCard'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/SectionHeading'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useUtils'
import { formatDate, formatTime, friendlyDate, fromNow, isActiveStatus } from '@/lib/utils'

export function PatientDashboardPage() {
  useDocumentTitle('Patient dashboard')
  const { user } = useAuth()
  const dashboard = useQuery({
    queryKey: ['patient-dashboard'],
    queryFn: patientApi.dashboard,
    refetchInterval: (query) => (query.state.data?.queue ? 20_000 : false),
  })

  if (dashboard.isLoading) return <SkeletonDashboard />

  if (dashboard.isError || !dashboard.data) {
    return (
      <ErrorState
        title="Could not load your dashboard"
        description={dashboard.error ? getErrorMessage(dashboard.error) : undefined}
        onRetry={() => void dashboard.refetch()}
      />
    )
  }

  const data = dashboard.data
  const firstName = user?.full_name.split(' ')[0] || 'there'
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const notifications = data.notifications.slice(0, 3)
  const upcoming = data.recent.filter((item) => isActiveStatus(item.status)).slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here is your care overview, next visit and live queue status."
        className="rounded-3xl border border-brand-100/80 bg-gradient-to-r from-white via-brand-50/80 to-mint-50/70 px-5 py-5 shadow-soft sm:px-7 sm:py-6"
        action={
          <Link to="/book" className={buttonClasses('primary', 'md')}>
            <CalendarPlus className="size-4" /> Book appointment
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming" value={data.stats.upcoming} hint="Active bookings" icon={CalendarClock} />
        <StatCard label="Today" value={data.stats.today} hint="Appointments today" icon={Clock3} tone="mint" />
        <StatCard label="Completed" value={data.stats.completed} hint="All time" icon={CheckCircle2} tone="amber" />
        <StatCard label="Cancelled" value={data.stats.cancelled} hint="All time" icon={CalendarX2} tone="rose" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {data.queue ? (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                  <Radio className="size-4 text-mint-500" /> Live queue
                </h2>
                <Link to="/patient/queue" className="text-[11px] font-semibold text-brand-600 hover:underline">
                  Full view <ArrowRight className="inline size-3" />
                </Link>
              </div>
              <QueueTracker data={data.queue} />
            </section>
          ) : data.today_appointment ? (
            <Card>
              <CardHeader title="Today’s appointment" description="Reception will check you in before the queue starts." />
              <CardBody>
                <AppointmentCard appointment={data.today_appointment} detailPath={`/patient/appointments/${data.today_appointment.id}`} />
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-[11px] leading-5 text-brand-700">
                  <BellRing className="mt-0.5 size-3.5 shrink-0" />
                  Queue tracking becomes live after reception checks you in. Please arrive 10 minutes early.
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader title="No appointment today" description="Your next visit will appear here." />
              <CardBody>
                <EmptyState
                  title="A calmer day ahead"
                  description="You have no appointment scheduled for today. Book a visit whenever you need one."
                  icon={CalendarCheck2}
                  action={
                    <Link to="/book" className={buttonClasses('primary', 'sm')}>
                      Book appointment
                    </Link>
                  }
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Recent appointments"
              description="Your latest bookings and visit history"
              action={
                <Link to="/patient/appointments" className="text-[11px] font-semibold text-brand-600 hover:underline">
                  View all
                </Link>
              }
            />
            <CardBody className="space-y-3">
              {data.recent.length ? (
                data.recent.slice(0, 3).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    detailPath={`/patient/appointments/${appointment.id}`}
                  />
                ))
              ) : (
                <EmptyState
                  title="No appointments yet"
                  description="Book your first appointment to see it here."
                  action={
                    <Link to="/book" className={buttonClasses('primary', 'sm')}>
                      Book now
                    </Link>
                  }
                />
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-5">
          {data.next_appointment ? <NextAppointmentCard appointment={data.next_appointment} /> : null}

          <Card>
            <CardHeader title="Quick actions" />
            <CardBody className="grid gap-2">
              {[
                { icon: CalendarPlus, title: 'Book a visit', detail: 'Find a doctor and time', to: '/book' },
                { icon: Clock3, title: 'Track queue', detail: 'Follow today’s position', to: '/patient/queue' },
                { icon: Stethoscope, title: 'My appointments', detail: 'Manage upcoming visits', to: '/patient/appointments' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <action.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-ink-800">{action.title}</span>
                    <span className="block text-[10px] text-ink-400">{action.detail}</span>
                  </span>
                  <ArrowRight className="size-3.5 text-ink-300 transition group-hover:text-brand-500" />
                </Link>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Notifications"
              action={
                <Link to="/notifications" className="text-[11px] font-semibold text-brand-600 hover:underline">
                  View all
                </Link>
              }
            />
            <CardBody>
              {notifications.length ? (
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <div key={item.id} className="flex gap-2.5">
                      <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.is_read ? 'bg-ink-200' : 'bg-brand-500'}`} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-ink-800">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-ink-500">{item.message}</p>
                        <p className="mt-0.5 text-[9px] text-ink-400">{fromNow(item.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-[11px] text-ink-400">No notifications yet.</p>
              )}
            </CardBody>
          </Card>

          {upcoming.length ? (
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Coming up</p>
              <div className="mt-2 space-y-2">
                {upcoming.map((appointment) => (
                  <Link
                    key={appointment.id}
                    to={`/patient/appointments/${appointment.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[10px]"
                  >
                    <span className="min-w-0 truncate font-semibold text-ink-700">{appointment.doctor_name}</span>
                    <span className="shrink-0 text-ink-400">{friendlyDate(appointment.appointment_date)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <p className="text-[10px] text-ink-400">
        Last loaded {formatDate(new Date(), 'dd MMM')} at {formatTime(format(new Date(), 'HH:mm'))} · Demo data only
      </p>
    </div>
  )
}
