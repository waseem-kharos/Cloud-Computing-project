import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/endpoints'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useDocumentTitle } from '@/hooks/useUtils'

export function AdminQueuesPage() {
  useDocumentTitle('Queues')
  const queues = useQuery({ queryKey: ['admin-queues'], queryFn: () => adminApi.queues() })
  const data = queues.data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Queues</h1>
      <Card>
        <CardHeader title={`Queues - ${data?.date}`} />
        <CardBody className="space-y-2">
          {data?.items.map((item) => (
            <div key={item.doctor.id} className="flex items-center justify-between rounded-xl border border-line p-3">
              <div>
                <p className="font-semibold text-ink-900">{item.doctor.full_name}</p>
                <p className="text-xs text-ink-400">{item.doctor.specialization} · {item.doctor.department_name}</p>
              </div>
              <div className="flex gap-4 text-xs text-ink-600">
                <span>Waiting: {item.stats.waiting}</span>
                <span>In progress: {item.stats.in_progress}</span>
                <span>Completed: {item.stats.completed}</span>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
