import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { AuthShell } from '@/components/layout/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useUtils'
import { DEMO_ACCOUNTS } from '@/lib/constants'
import { dashboardPath, safeNextPath } from '@/lib/utils'
import { loginSchema, type LoginValues } from '@/lib/validation'

export function LoginPage() {
  useDocumentTitle('Login')
  const { user, login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const home = user ? safeNextPath(redirect, dashboardPath[user.role]) : '/'
  if (user) return <Navigate to={home} replace />

  async function onSubmit(values: LoginValues) {
    setServerError('')
    try {
      const nextUser = await login(values.email, values.password)
      toast({ title: 'Welcome back', description: `Signed in as ${nextUser.full_name}.` })
      navigate(safeNextPath(redirect, dashboardPath[nextUser.role]), { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  function useDemo(email: string, password: string) {
    setValue('email', email, { shouldValidate: true })
    setValue('password', password, { shouldValidate: true })
    setServerError('')
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage appointments and follow your live queue."
      footer={
        <>
          New to MediQueue?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Create a patient account
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
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          icon={<LockKeyhole className="size-4" />}
          error={errors.password?.message}
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

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          icon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-7 border-t border-line pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Demo accounts</p>
          <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[9px] font-semibold text-amber-700">Synthetic data</span>
        </div>
        <div className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => useDemo(account.email, account.password)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-800">{account.role}</p>
                <p className="truncate text-[10px] text-ink-400">{account.email}</p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-brand-600">Use account</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}
