import { useQuery } from '@tanstack/react-query'
import { Activity, CalendarDays, MessageSquare, Stethoscope, Users } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { StatCard } from '@/components/domain/StatCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useDocumentTitle } from '@/hooks/useUtils'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard')
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats })

  const data = stats.data
  if (!data) return <div className="h-64 animate-pulse rounded-2xl bg-ink-50" />

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-brand-100/80 bg-gradient-to-r from-white via-brand-50/80 to-violet-50/60 px-5 py-5 shadow-soft sm:px-7 sm:py-6">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Operations overview</p>
        <h1 className="text-2xl font-bold text-ink-950">Admin dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Hospital overview and activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patients" value={data.total_patients} icon={Users} />
        <StatCard label="Doctors" value={data.total_doctors} icon={Stethoscope} tone="mint" />
        <StatCard label="Appointments" value={data.total_appointments} icon={CalendarDays} />
        <StatCard label="Today" value={data.today_appointments} icon={Activity} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Recent activity" action={<Link to="/admin/activity" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>} />
          <CardBody className="space-y-2">
            {data.recent_activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-sm">
                <div>
                  <p className="font-medium text-ink-800">{a.description}</p>
                  <p className="text-xs text-ink-400">{a.actor_name}</p>
                </div>
                <span className="text-xs text-ink-400">{a.created_at ? formatDate(a.created_at) : ''}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Messages" action={<Link to="/admin/messages" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>} />
          <CardBody className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-5 text-brand-600" />
              <div>
                <p className="font-semibold text-ink-900">{data.unread_messages} unread</p>
                <p className="text-xs text-ink-400">Contact messages</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
