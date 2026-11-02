import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/endpoints'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { useDocumentTitle } from '@/hooks/useUtils'
import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/Button'

export function AdminSchedulesPage() {
  useDocumentTitle('Schedules')
  const doctors = useQuery({ queryKey: ['admin-doctors-all'], queryFn: () => adminApi.doctors({ page_size: 50 }) })
  const data = doctors.data?.items || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Schedules</h1>
      <Card>
        <CardHeader title="Manage doctor schedules" />
        <CardBody>
          <DataTable
            rows={data}
            getRowKey={(r) => r.id}
            columns={[
              { key: 'doctor', header: 'Doctor', render: (r) => <div><p className="font-medium">{r.full_name}</p><p className="text-xs text-ink-400">{r.designation}</p></div> },
              { key: 'dept', header: 'Department', render: (r) => r.department.name },
              { key: 'room', header: 'Room', render: (r) => r.room_number },
              { key: 'action', header: '', render: (r) => <Link to={`/admin/doctors/${r.id}/schedule`} className={buttonClasses('outline', 'sm')}>Manage</Link> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
