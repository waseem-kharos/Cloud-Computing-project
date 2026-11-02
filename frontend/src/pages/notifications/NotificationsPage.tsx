import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDocumentTitle } from '@/hooks/useUtils'
import { fromNow } from '@/lib/utils'
import { Link } from 'react-router-dom'

export function NotificationsPage() {
  useDocumentTitle('Notifications')
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list, refetchInterval: 60000 })
  const markAll = useMutation({ mutationFn: notificationApi.markAllRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
  const markOne = useMutation({ mutationFn: notificationApi.markRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })

  const items = query.data || []
  const unread = items.filter((i) => !i.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">{unread} unread</p>
        </div>
        {unread ? <Button variant="outline" onClick={() => markAll.mutate()} loading={markAll.isPending}><CheckCheck className="size-4" /> Mark all read</Button> : null}
      </div>

      <Card>
        <CardHeader title="All notifications" />
        <CardBody>
          {items.length ? (
            <div className="divide-y divide-line">
              {items.map((item) => (
                <div key={item.id} className={`flex items-start gap-3 py-3 ${!item.is_read ? 'bg-brand-50/30 px-2 -mx-2 rounded-lg' : ''}`}>
                  <Bell className="mt-1 size-4 text-brand-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-ink-900">{item.title}</p>
                      {!item.is_read ? <Button size="sm" variant="ghost" onClick={() => markOne.mutate(item.id)}>Mark read</Button> : null}
                    </div>
                    <p className="mt-1 text-sm text-ink-600">{item.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-400">
                      <span>{fromNow(item.created_at)}</span>
                      {item.link ? <Link to={item.link} className="text-brand-600 hover:underline">View</Link> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No notifications" icon={Bell} />}
        </CardBody>
      </Card>
    </div>
  )
}
