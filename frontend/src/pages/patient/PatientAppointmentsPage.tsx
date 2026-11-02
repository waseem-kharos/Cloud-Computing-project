import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, FileText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { patientApi } from '@/api/endpoints'
import { AppointmentCard } from '@/components/domain/AppointmentCard'
import { buttonClasses } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { useDocumentTitle } from '@/hooks/useUtils'

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
] as const

export function PatientAppointmentsPage() {
  useDocumentTitle('My appointments')
  const [scope, setScope] = useState<(typeof tabs)[number]['value']>('all')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['patient-appointments', scope, page],
    queryFn: () => patientApi.appointments({ scope, page, page_size: 8 }),
  })

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Could not load appointments"
        description={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const data = query.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">My appointments</h1>
          <p className="mt-1 text-sm text-ink-500">Manage, reschedule or track your visits</p>
        </div>
        <Link to="/book" className={buttonClasses('primary', 'md')}>
          <CalendarPlus className="size-4" /> Book appointment
        </Link>
      </div>

      <Card>
        <CardHeader title="Appointments" description={`${data?.total || 0} total`} />
        <CardBody className="space-y-4">
          <Tabs
            tabs={tabs}
            value={scope}
            onChange={(v) => {
              setScope(v as (typeof tabs)[number]['value'])
              setPage(1)
            }}
          />
          {data?.items.length ? (
            <div className="space-y-3">
              {data.items.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  detailPath={`/patient/appointments/${appointment.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No appointments"
              description="Book your first appointment to get started"
              icon={FileText}
              action={
                <Link to="/book" className={buttonClasses('primary', 'sm')}>
                  <CalendarPlus className="size-4" /> Book now
                </Link>
              }
            />
          )}
          {data && data.pages > 1 ? (
            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              pageSize={data.page_size}
              onPageChange={setPage}
            />
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}
