import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { getErrorMessage } from '@/api/client'
import { publicApi } from '@/api/endpoints'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { contactSchema, type ContactValues } from '@/lib/validation'

export function ContactForm({ compact }: { compact?: boolean }) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  })

  const mutation = useMutation({
    mutationFn: publicApi.contact,
    onSuccess: () => {
      toast({ title: 'Message sent', description: 'Our demo team will get back to you soon.' })
      reset()
    },
    onError: (error) =>
      toast({ title: 'Message not sent', description: getErrorMessage(error), tone: 'error' }),
  })

  return (
    <form
      onSubmit={handleSubmit((values) =>
        mutation.mutate({
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
        <Input label="Full name" placeholder="Your name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>
      <Input
        label="Subject"
        placeholder="Appointment question"
        error={errors.subject?.message}
        {...register('subject')}
      />
      <Textarea
        label="How can we help?"
        placeholder="Tell us what you would like to know about appointments, departments or the queue."
        error={errors.message?.message}
        {...register('message')}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] text-ink-400">Please do not include sensitive medical details.</p>
        <Button type="submit" loading={mutation.isPending} trailingIcon={<Send className="size-3.5" />}>
          Send message
        </Button>
      </div>
    </form>
  )
}
