import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useDocumentTitle } from '@/hooks/useUtils'
import { formatDate } from '@/lib/utils'

export function AdminMessagesPage() {
  useDocumentTitle('Messages')
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['admin-messages'], queryFn: () => adminApi.messages({ page_size: 20 }) })
  const handle = useMutation({
    mutationFn: (id: number) => adminApi.handleMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-messages'] }),
  })

  const data = query.data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Messages</h1>
      <Card>
        <CardHeader title="Contact messages" />
        <CardBody className="space-y-2">
          {data?.items.map((m) => (
            <div key={m.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{m.name} <span className="text-xs text-ink-400">({m.email})</span></p>
                  <p className="text-xs text-ink-400">{m.created_at ? formatDate(m.created_at) : ''}</p>
                </div>
                {!m.is_handled ? <Button size="sm" onClick={() => handle.mutate(m.id)} loading={handle.isPending}>Mark handled</Button> : <span className="text-xs text-mint-600">Handled</span>}
              </div>
              <p className="mt-2 text-sm text-ink-700 whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}
