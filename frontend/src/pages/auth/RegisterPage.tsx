import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserPlus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input, Select } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useUtils'
import { GENDER_OPTIONS } from '@/lib/constants'
import { registerSchema, type RegisterValues } from '@/lib/validation'

export function RegisterPage() {
  useDocumentTitle('Create account')
  const { user, register: registerUser } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      password: '',
      confirm_password: '',
      accept_terms: false,
    },
  })

  if (user) return <Navigate to="/patient" replace />

  async function onSubmit(values: RegisterValues) {
    setServerError('')
    try {
      const next = await registerUser({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        date_of_birth: values.date_of_birth || undefined,
        gender: values.gender || undefined,
      })
      toast({ title: 'Account created', description: `Welcome to MediQueue, ${next.full_name.split(' ')[0]}.` })
      navigate('/patient', { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  return (
    <AuthShell
      title="Create your patient account"
      subtitle="Book appointments, manage visits and follow the live queue from one place."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
            {serverError}
          </div>
        ) : null}

        <Input
          label="Full name"
          placeholder="Your full name"
          autoComplete="name"
          icon={<UserRound className="size-4" />}
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            type="tel"
            label="Phone"
            placeholder="+92 300 0000000"
            autoComplete="tel"
            icon={<Phone className="size-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Date of birth"
            autoComplete="bday"
            error={errors.date_of_birth?.message}
            {...register('date_of_birth')}
          />
          <Select label="Gender" error={errors.gender?.message} {...register('gender')}>
            <option value="">Prefer not to say</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          icon={<LockKeyhole className="size-4" />}
          error={errors.password?.message}
          hint="Use uppercase, lowercase and a number."
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="flex size-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          {...register('password')}
        />
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          icon={<CheckCircle2 className="size-4" />}
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Checkbox
          label={
            <>
              I agree to the{' '}
              <Link to="/terms" className="font-semibold text-brand-600 hover:underline" target="_blank">
                terms of use
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-semibold text-brand-600 hover:underline" target="_blank">
                privacy notice
              </Link>
              .
            </>
          }
          error={errors.accept_terms?.message}
          {...register('accept_terms')}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          icon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  )
}
