import { useQuery } from '@tanstack/react-query'
import { Radio } from 'lucide-react'
import { patientApi } from '@/api/endpoints'
import { QueueTracker } from '@/components/domain/QueueTracker'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { useDocumentTitle } from '@/hooks/useUtils'
import { getErrorMessage } from '@/api/client'
import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/Button'

export function PatientQueuePage() {
  useDocumentTitle('Live queue')
  const queue = useQuery({
    queryKey: ['patient-queue'],
    queryFn: () => patientApi.queue(),
    refetchInterval: (q) => (q.state.data?.queue ? 15000 : false),
  })

  if (queue.isLoading) return <div className="h-80 animate-pulse rounded-2xl bg-ink-50" />
  if (queue.isError) return <ErrorState title="Could not load queue" description={getErrorMessage(queue.error)} onRetry={() => void queue.refetch()} />

  const data = queue.data

  if (!data?.queue || !data.appointment) {
    return (
      <Card>
        <CardHeader title="Live queue" description="No active queue for today" />
        <CardBody>
          <EmptyState title="No active queue" description="You don't have an appointment with an active queue right now." action={<Link to="/book" className={buttonClasses('primary', 'sm')}>Book appointment</Link>} />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">Live queue</h1>
        <p className="mt-1 text-sm text-ink-500">Track your position in real time</p>
      </div>
      <QueueTracker data={data.queue} />
    </div>
  )
}
