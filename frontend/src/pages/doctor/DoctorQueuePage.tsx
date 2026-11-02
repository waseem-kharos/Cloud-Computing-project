import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PhoneCall, RefreshCw } from 'lucide-react'
import { doctorApi } from '@/api/endpoints'
import { AppointmentCard } from '@/components/domain/AppointmentCard'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useUtils'
import { getErrorMessage } from '@/api/client'

export function DoctorQueuePage() {
  useDocumentTitle("Today's queue")
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const queue = useQuery({ queryKey: ['doctor-queue'], queryFn: () => doctorApi.queue(), refetchInterval: 15000 })

  const callNext = useMutation({
    mutationFn: () => doctorApi.callNext(),
    onSuccess: (res) => {
      toast({ title: res.message })
      queryClient.invalidateQueries({ queryKey: ['doctor-queue'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-dashboard'] })
    },
    onError: (error) => toast({ title: 'Action failed', description: getErrorMessage(error), tone: 'error' }),
  })

  const data = queue.data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-950">Today's queue</h1>
          <p className="mt-1 text-sm text-ink-500">{data?.date}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void queue.refetch()}><RefreshCw className="size-4" /> Refresh</Button>
          <Button onClick={() => callNext.mutate()} loading={callNext.isPending}><PhoneCall className="size-4" /> Call next</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Waiting" />
          <CardBody className="space-y-2">
            {data?.waiting.length ? data.waiting.map((a) => <AppointmentCard key={a.id} appointment={a} detailPath={`/doctor/appointments/${a.id}`} />) : <EmptyState title="No patients waiting" />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Completed" />
          <CardBody className="space-y-2">
            {data?.completed.length ? data.completed.slice(0, 6).map((a) => <AppointmentCard key={a.id} appointment={a} compact detailPath={`/doctor/appointments/${a.id}`} />) : <p className="text-sm text-ink-400">None yet</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
