import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, BellRing, CalendarCheck2, CheckCheck, Info, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { notificationApi } from '@/api/endpoints'
import type { Notification } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import { fromNow } from '@/lib/utils'

function NotificationIcon({ type }: { type: string }) {
  if (type === 'warning' || type === 'cancellation') {
    return <TriangleAlert aria-hidden className="size-4 text-amber-500" />
  }
  if (type === 'success' || type === 'queue') {
    return <CalendarCheck2 aria-hidden className="size-4 text-mint-500" />
  }
  return <Info aria-hidden className="size-4 text-brand-500" />
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    refetchInterval: 60_000,
  })

  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const unread = (query.data || []).filter((item) => !item.is_read).length

  function openNotification(item: Notification) {
    if (!item.is_read) markOne.mutate(item.id)
    setOpen(false)
    if (item.link) navigate(item.link)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-10 items-center justify-center rounded-xl border border-line bg-white text-ink-500 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'}
        aria-expanded={open}
      >
        {unread ? <BellRing className="size-[18px]" /> : <Bell className="size-[18px]" />}
        {unread ? (
          <span className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 py-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">Notifications</p>
              <p className="text-[11px] text-ink-400">{unread} unread</p>
            </div>
            {unread ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAll.mutate()}
                loading={markAll.isPending}
                icon={<CheckCheck className="size-3.5" />}
              >
                Mark all
              </Button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-lg bg-ink-50" />
                ))}
              </div>
            ) : query.data?.length ? (
              query.data.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-ink-50/60',
                    !item.is_read && 'bg-brand-50/40',
                  )}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-line">
                    <NotificationIcon type={item.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-ink-900">{item.title}</span>
                      {!item.is_read ? <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-500" /> : null}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] leading-4 text-ink-500">{item.message}</span>
                    <span className="mt-1 block text-[10px] text-ink-400">{fromNow(item.created_at)}</span>
                  </span>
                </button>
              ))
            ) : (
              <EmptyState title="No notifications" description="Updates about appointments and queues appear here." />
            )}
          </div>

          <div className="border-t border-line p-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
