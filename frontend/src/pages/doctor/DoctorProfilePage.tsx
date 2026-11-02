import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getErrorMessage } from '@/api/client'
import { doctorApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useUtils'
import { doctorProfileSchema, type DoctorProfileValues } from '@/lib/validation'
import { useQuery } from '@tanstack/react-query'

export function DoctorProfilePage() {
  useDocumentTitle('Doctor profile')
  const { user } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()
  const profile = useQuery({ queryKey: ['doctor-profile'], queryFn: doctorApi.profile })

  const form = useForm({
    resolver: zodResolver(doctorProfileSchema),
    values: {
      full_name: profile.data?.full_name || user?.full_name || '',
      phone: profile.data?.phone || user?.phone || '',
      designation: profile.data?.designation || '',
      qualifications: profile.data?.qualifications || '',
      bio: profile.data?.bio || '',
      room_number: profile.data?.room_number || '',
      consultation_fee: profile.data?.consultation_fee || 0,
      avg_consult_minutes: profile.data?.avg_consult_minutes || 15,
      experience_years: profile.data?.experience_years || 0,
      languages: profile.data?.languages || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: DoctorProfileValues) => doctorApi.updateProfile({
      full_name: values.full_name,
      phone: values.phone || undefined,
      specialization: values.designation,
      qualifications: values.qualifications,
      bio: values.bio || undefined,
      room: values.room_number,
      consultation_fee: Number(values.consultation_fee),
      avg_consult_minutes: Number(values.avg_consult_minutes),
      experience_years: Number(values.experience_years),
    }),
    onSuccess: () => { toast({ title: 'Profile updated' }); qc.invalidateQueries({ queryKey: ['doctor-profile'] }); qc.invalidateQueries({ queryKey: ['doctor-dashboard'] }) },
    onError: (e) => toast({ title: 'Failed', description: getErrorMessage(e), tone: 'error' }),
  })

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-ink-950">Professional profile</h1>
      <Card>
        <CardHeader title="Profile details" />
        <CardBody>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <Input className="sm:col-span-2" label="Full name" {...form.register('full_name')} error={form.formState.errors.full_name?.message} />
            <Input label="Phone" {...form.register('phone')} error={form.formState.errors.phone?.message} />
            <Input label="Designation" {...form.register('designation')} error={form.formState.errors.designation?.message} />
            <Input className="sm:col-span-2" label="Qualifications" {...form.register('qualifications')} error={form.formState.errors.qualifications?.message} />
            <Textarea className="sm:col-span-2" label="Bio" {...form.register('bio')} error={form.formState.errors.bio?.message} />
            <Input label="Room number" {...form.register('room_number')} error={form.formState.errors.room_number?.message} />
            <Input label="Languages" {...form.register('languages')} error={form.formState.errors.languages?.message} />
            <Input type="number" label="Experience (years)" {...form.register('experience_years')} error={form.formState.errors.experience_years?.message} />
            <Input type="number" label="Avg consult (min)" {...form.register('avg_consult_minutes')} error={form.formState.errors.avg_consult_minutes?.message} />
            <Input type="number" label="Consultation fee" {...form.register('consultation_fee')} error={form.formState.errors.consultation_fee?.message} />
            <div className="sm:col-span-2"><Button type="submit" loading={mutation.isPending}>Save changes</Button></div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
