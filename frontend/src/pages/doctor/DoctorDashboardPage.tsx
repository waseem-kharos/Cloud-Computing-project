import { useQuery } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, Clock3, Radio, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { doctorApi } from '@/api/endpoints'
import { AppointmentCard } from '@/components/domain/AppointmentCard'
import { DoctorHero } from '@/components/dashboard/DoctorHero'
import { StatCard } from '@/components/domain/StatCard'
import { buttonClasses } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useUtils'

export function DoctorDashboardPage() {
  useDocumentTitle('Doctor dashboard')
  const { user } = useAuth()
  const dashboard = useQuery({ queryKey: ['doctor-dashboard'], queryFn: doctorApi.dashboard, refetchInterval: 15000 })

  if (dashboard.isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-ink-50" />
  if (dashboard.isError || !dashboard.data) return <ErrorState title="Could not load dashboard" description={getErrorMessage(dashboard.error)} onRetry={() => void dashboard.refetch()} />

  const data = dashboard.data
  const stats = data.stats

  return (
    <div className="space-y-6">
      <DoctorHero />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Today total" value={stats.today_total} icon={CalendarClock} />
        <StatCard label="Waiting" value={stats.waiting} icon={Users} />
        <StatCard label="Checked in" value={stats.checked_in} icon={Clock3} tone="amber" />
        <StatCard label="In progress" value={stats.in_progress} icon={Radio} tone="mint" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} />
        <StatCard label="No show" value={stats.no_show} icon={Users} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Current & next" action={<Link to="/doctor/queue" className={buttonClasses('primary', 'sm')}>Open queue</Link>} />
          <CardBody className="space-y-3">
            {data.current ? <AppointmentCard appointment={data.current} detailPath={`/doctor/appointments/${data.current.id}`} /> : <EmptyState title="No patient in consultation" description="Call next from the queue" />}
            {data.next && !data.current ? <AppointmentCard appointment={data.next} detailPath={`/doctor/appointments/${data.next.id}`} /> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Waiting" action={<Link to="/doctor/queue" className="text-xs font-semibold text-brand-600 hover:underline">View queue</Link>} />
          <CardBody className="space-y-2">
            {data.waiting.length ? data.waiting.slice(0, 4).map((a) => <AppointmentCard key={a.id} appointment={a} compact detailPath={`/doctor/appointments/${a.id}`} />) : <p className="text-sm text-ink-400">No one waiting</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
