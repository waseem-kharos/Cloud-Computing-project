import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApi } from '@/api/endpoints'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Input, Select } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { useDebounced, useDocumentTitle } from '@/hooks/useUtils'

export function AdminDoctorsPage() {
  useDocumentTitle('Doctors')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const q = useDebounced(search, 300)

  const query = useQuery({
    queryKey: ['admin-doctors', q, status, page],
    queryFn: () => adminApi.doctors({ search: q || undefined, status, page, page_size: 10 }),
  })

  const data = query.data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Doctors</h1>
      <Card>
        <CardHeader title="Doctor list" />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Search name/specialization" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
            <Select value={status} onChange={(e) => { setStatus(e.target.value as any); setPage(1) }}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <DataTable
            rows={data?.items || []}
            getRowKey={(r) => r.id}
            columns={[
              { key: 'name', header: 'Doctor', render: (r) => <div><p className="font-medium">{r.full_name}</p><p className="text-xs text-ink-400">{r.designation}</p></div> },
              { key: 'dept', header: 'Department', render: (r) => r.department.name },
              { key: 'room', header: 'Room', render: (r) => r.room_number },
              { key: 'fee', header: 'Fee', render: (r) => r.consultation_fee },
              { key: 'status', header: 'Status', render: (r) => <span className={r.is_active ? 'text-mint-600' : 'text-ink-400'}>{r.is_active ? 'Active' : 'Inactive'}</span> },
            ]}
          />
          {data && data.pages > 1 ? <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.page_size} onPageChange={setPage} /> : null}
        </CardBody>
      </Card>
    </div>
  )
}
