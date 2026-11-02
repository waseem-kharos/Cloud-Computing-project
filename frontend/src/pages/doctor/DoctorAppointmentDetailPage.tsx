import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { doctorApi } from '@/api/endpoints'
import { AppointmentCard } from '@/components/domain/AppointmentCard'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { useState } from 'react'

export function DoctorAppointmentDetailPage() {
  const { id } = useParams()
  const appointmentId = Number(id)
  const { toast } = useToast()
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')

  const appointment = useQuery({
    queryKey: ['doctor-appointment', appointmentId],
    queryFn: () => doctorApi.appointment(appointmentId),
    enabled: Number.isFinite(appointmentId),
  })

  const update = useMutation({
    mutationFn: () => doctorApi.updateStatus(appointmentId, { status: status as any, doctor_notes: notes || undefined }),
    onSuccess: () => {
      toast({ title: 'Updated' })
      qc.invalidateQueries({ queryKey: ['doctor-appointment', appointmentId] })
      qc.invalidateQueries({ queryKey: ['doctor-appointments'] })
      qc.invalidateQueries({ queryKey: ['doctor-queue'] })
      qc.invalidateQueries({ queryKey: ['doctor-dashboard'] })
    },
    onError: (e) => toast({ title: 'Failed', description: getErrorMessage(e), tone: 'error' }),
  })

  const a = appointment.data
  if (!a) return null

  return (
    <div className="space-y-6">
      <Link to="/doctor/appointments" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-700"><ArrowLeft className="size-4" /> Back</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-950">Appointment {a.reference}</h1>
        <StatusBadge status={a.status} />
      </div>
      <AppointmentCard appointment={a} />

      <Card>
        <CardHeader title="Update status" />
        <CardBody className="space-y-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Select status</option>
            <option value="checked_in">Checked in</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="no_show">No show</option>
          </Select>
          <Textarea placeholder="Doctor notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button disabled={!status} loading={update.isPending} onClick={() => update.mutate()}>Update</Button>
        </CardBody>
      </Card>
    </div>
  )
}
