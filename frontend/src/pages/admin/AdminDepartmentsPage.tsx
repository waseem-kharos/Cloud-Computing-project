import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/endpoints'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { useDocumentTitle } from '@/hooks/useUtils'

export function AdminDepartmentsPage() {
  useDocumentTitle('Departments')
  const query = useQuery({ queryKey: ['admin-departments'], queryFn: adminApi.departments })
  const data = query.data || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Departments</h1>
      <Card>
        <CardHeader title="Departments" />
        <CardBody>
          <DataTable
            rows={data}
            getRowKey={(r) => r.id}
            columns={[
              { key: 'name', header: 'Name', render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-ink-400">{r.slug}</p></div> },
              { key: 'desc', header: 'Description', render: (r) => <span className="line-clamp-1">{r.description}</span> },
              { key: 'doctors', header: 'Doctors', render: (r) => r.doctor_count },
              { key: 'status', header: 'Status', render: (r) => <span className={r.is_active ? 'text-mint-600' : 'text-ink-400'}>{r.is_active ? 'Active' : 'Inactive'}</span> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
