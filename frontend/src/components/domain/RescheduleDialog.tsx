import { useMutation, useQuery } from '@tanstack/react-query'
import { CalendarClock, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { patientApi, publicApi } from '@/api/endpoints'
import { getErrorMessage } from '@/api/client'
import type { Appointment } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { formatTime, todayISO } from '@/lib/utils'

export function RescheduleDialog({
  appointment,
  onClose,
  onSuccess,
  open,
}: {
  appointment: Appointment | null
  onClose: () => void
  onSuccess?: () => void
  open?: boolean
}) {
  const { toast } = useToast()
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('')

  useEffect(() => {
    if (appointment) {
      setDate(appointment.appointment_date >= todayISO() ? appointment.appointment_date : todayISO())
      setTime('')
    }
  }, [appointment])

  const slotsQuery = useQuery({
    queryKey: ['public-slots', appointment?.doctor_id, date],
    queryFn: () => publicApi.slots(appointment!.doctor_id, date),
    enabled: Boolean(appointment && date),
  })

  const mutation = useMutation({
    mutationFn: () => patientApi.reschedule(appointment!.id, { appointment_date: date, start_time: time }),
    onSuccess: () => {
      toast({ title: 'Appointment rescheduled', description: 'Your new slot is confirmed.' })
      onSuccess?.()
      onClose()
    },
    onError: (error) => toast({ title: 'Could not reschedule', description: getErrorMessage(error), tone: 'error' }),
  })

  return (
    <Modal
      open={open !== undefined ? open : Boolean(appointment)}
      onClose={onClose}
      title="Reschedule appointment"
      description={
        appointment
          ? `${appointment.doctor_name} · ${appointment.department_name}. Your queue number will be recalculated for the new slot.`
          : undefined
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Keep current
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!time || slotsQuery.isLoading}
          >
            Confirm new slot
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Input
          type="date"
          label="New date"
          value={date}
          min={todayISO()}
          onChange={(event) => {
            setDate(event.target.value)
            setTime('')
          }}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink-700">Available times</p>
            <span className="text-[11px] text-ink-400">Current slot is also shown</span>
          </div>

          {slotsQuery.isLoading ? (
            <div className="flex h-28 items-center justify-center rounded-xl border border-line bg-ink-50">
              <Loader2 className="size-5 animate-spin text-brand-500" />
            </div>
          ) : slotsQuery.isError ? (
            <p className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-600">
              {getErrorMessage(slotsQuery.error)}
            </p>
          ) : slotsQuery.data?.length ? (
            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {slotsQuery.data.map((slot) => {
                const selected = time === slot.start_time
                return (
                  <button
                    key={slot.start_time}
                    type="button"
                    disabled={!slot.is_available}
                    onClick={() => setTime(slot.start_time)}
                    className={cn(
                      'rounded-lg border px-2 py-2.5 text-xs font-semibold transition',
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                        : 'border-line bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50',
                      !slot.is_available && 'cursor-not-allowed border-line bg-ink-50 text-ink-300 line-through hover:bg-ink-50',
                    )}
                  >
                    {formatTime(slot.start_time)}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-ink-50 p-5 text-center">
              <CalendarClock className="mx-auto size-5 text-ink-400" />
              <p className="mt-2 text-xs text-ink-500">No published slots for this date.</p>
            </div>
          )}
        </div>

        <p className="rounded-lg bg-brand-50 px-3 py-2 text-[11px] leading-5 text-brand-700">
          Only one active booking is allowed per doctor and time slot. Cancelled slots become available again.
        </p>
      </div>
    </Modal>
  )
}
