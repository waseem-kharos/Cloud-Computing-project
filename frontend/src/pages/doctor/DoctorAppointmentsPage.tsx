import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { doctorApi } from '@/api/endpoints'
import { AppointmentCard } from '@/components/domain/AppointmentCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { useDebounced, useDocumentTitle } from '@/hooks/useUtils'

export function DoctorAppointmentsPage() {
  useDocumentTitle('Appointments')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [day, setDay] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search, 300)

  const query = useQuery({
    queryKey: ['doctor-appointments', q, status, day, page],
    queryFn: () => doctorApi.appointments({ search: q || undefined, status: status || undefined, day: day || undefined, page, page_size: 10 }),
  })

  if (query.isError) return <ErrorState title="Could not load appointments" description={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />

  const data = query.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Appointments</h1>
        <p className="mt-1 text-sm text-ink-500">Search and manage all appointments</p>
      </div>

      <Card>
        <CardHeader title="All appointments" />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="Search patient/name/reference" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            <Input type="date" value={day} onChange={(e) => { setDay(e.target.value); setPage(1) }} />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="">All statuses</option>
              <option value="booked">Booked</option>
              <option value="checked_in">Checked in</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </Select>
          </div>
          {data?.items.length ? (
            <div className="space-y-2">
              {data.items.map((a) => <AppointmentCard key={a.id} appointment={a} detailPath={`/doctor/appointments/${a.id}`} />)}
            </div>
          ) : <p className="py-8 text-center text-sm text-ink-400">No appointments found</p>}
          {data && data.pages > 1 ? <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.page_size} onPageChange={setPage} /> : null}
        </CardBody>
      </Card>
    </div>
  )
}
