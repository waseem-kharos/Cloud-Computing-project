import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { doctorApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useDocumentTitle } from '@/hooks/useUtils'
import { WEEKDAYS } from '@/lib/constants'

export function DoctorSchedulePage() {
  useDocumentTitle('My schedule')
  const { toast } = useToast()
  const qc = useQueryClient()
  const schedule = useQuery({ queryKey: ['doctor-schedule'], queryFn: doctorApi.schedule })
  const [blocks, setBlocks] = useState<any[]>([])

  const save = useMutation({
    mutationFn: () => doctorApi.updateSchedule(blocks.length ? blocks : (schedule.data?.availability || [])),
    onSuccess: () => { toast({ title: 'Schedule updated' }); qc.invalidateQueries({ queryKey: ['doctor-schedule'] }) },
    onError: (e) => toast({ title: 'Failed', description: getErrorMessage(e), tone: 'error' }),
  })

  const addTimeOff = useMutation({
    mutationFn: (payload: { off_date: string; reason?: string }) => doctorApi.addTimeOff(payload),
    onSuccess: () => { toast({ title: 'Time off added' }); qc.invalidateQueries({ queryKey: ['doctor-schedule'] }) },
  })

  const removeTimeOff = useMutation({
    mutationFn: (id: number) => doctorApi.removeTimeOff(id),
    onSuccess: () => { toast({ title: 'Removed' }); qc.invalidateQueries({ queryKey: ['doctor-schedule'] }) },
  })

  const data = schedule.data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">My schedule</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Availability" action={<Button size="sm" onClick={() => save.mutate()} loading={save.isPending}>Save</Button>} />
          <CardBody className="space-y-2">
            {(data?.availability || []).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-sm">
                <span>{WEEKDAYS[b.day_of_week]} {b.start_time}-{b.end_time}</span>
                <span className="text-xs text-ink-400">{b.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Time off" />
          <CardBody className="space-y-2">
            {(data?.time_off || []).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-line p-2 text-sm">
                <span>{t.off_date} {t.reason ? `- ${t.reason}` : ''}</span>
                <Button variant="ghost" size="sm" onClick={() => removeTimeOff.mutate(t.id)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = e.target as any; addTimeOff.mutate({ off_date: f.date.value }); f.reset() }}>
              <Input name="date" type="date" />
              <Button type="submit">Add</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
