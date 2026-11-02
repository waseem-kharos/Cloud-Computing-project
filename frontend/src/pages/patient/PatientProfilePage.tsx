import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getErrorMessage } from '@/api/client'
import { authApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useUtils'
import { GENDER_OPTIONS } from '@/lib/constants'
import { profileSchema, type ProfileValues } from '@/lib/validation'

export function PatientProfilePage() {
  useDocumentTitle('My profile')
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      date_of_birth: user?.date_of_birth || '',
      gender: user?.gender || '',
      address: user?.address || '',
    },
  })

  const mutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (updated) => {
      updateUser(updated)
      queryClient.invalidateQueries({ queryKey: ['auth-me'] })
      toast({ title: 'Profile updated' })
    },
    onError: (error) => toast({ title: 'Update failed', description: getErrorMessage(error), tone: 'error' }),
  })

  if (!user) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-950">My profile</h1>
        <p className="mt-1 text-sm text-ink-500">Update your personal details</p>
      </div>

      <Card>
        <CardHeader title="Personal information" description={user.email} />
        <CardBody>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
            <Input label="Full name" icon={<UserRound className="size-4" />} error={form.formState.errors.full_name?.message} {...form.register('full_name')} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone" {...form.register('phone')} error={form.formState.errors.phone?.message} />
              <Input type="date" label="Date of birth" {...form.register('date_of_birth')} error={form.formState.errors.date_of_birth?.message} />
            </div>
            <Select label="Gender" {...form.register('gender')} error={form.formState.errors.gender?.message}>
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </Select>
            <Input label="Address" {...form.register('address')} error={form.formState.errors.address?.message} />
            <Button type="submit" loading={mutation.isPending}>Save changes</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
