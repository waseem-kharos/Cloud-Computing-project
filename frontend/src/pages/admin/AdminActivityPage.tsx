import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/endpoints'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useDocumentTitle } from '@/hooks/useUtils'
import { fromNow } from '@/lib/utils'

export function AdminActivityPage() {
  useDocumentTitle('Activity log')
  const query = useQuery({ queryKey: ['admin-activity'], queryFn: () => adminApi.activity({ page_size: 30 }) })
  const data = query.data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Activity log</h1>
      <Card>
        <CardHeader title="Recent activity" />
        <CardBody className="space-y-2">
          {data?.items.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-line p-2">
              <div>
                <p className="text-sm text-ink-800">{a.description}</p>
                <p className="text-xs text-ink-400">{a.actor_name}</p>
              </div>
              <span className="text-xs text-ink-400">{a.created_at ? fromNow(a.created_at) : ''}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
