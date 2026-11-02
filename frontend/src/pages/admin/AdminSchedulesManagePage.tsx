import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { adminApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useUtils'
import { WEEKDAYS } from '@/lib/constants'

export function AdminSchedulesManagePage() {
  useDocumentTitle('Manage schedule')
  const { id } = useParams()
  const doctorId = Number(id)
  const { toast } = useToast()
  const qc = useQueryClient()
  const schedule = useQuery({ queryKey: ['admin-schedule', doctorId], queryFn: () => adminApi.schedule(doctorId), enabled: Number.isFinite(doctorId) })
  const data = schedule.data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Manage schedule</h1>
      <Card>
        <CardHeader title={data?.doctor?.full_name || 'Doctor'} />
        <CardBody className="space-y-2">
          {(data?.availability || []).map((b: any) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-sm">
              <span>{WEEKDAYS[b.day_of_week]} {b.start_time}-{b.end_time}</span>
              <span className="text-xs text-ink-400">{b.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
