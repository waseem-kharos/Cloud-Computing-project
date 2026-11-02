import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock3, KeyRound, Radio, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { publicApi } from '@/api/endpoints'
import { QueueSkeleton, QueueTracker } from '@/components/domain/QueueTracker'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses, Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDocumentTitle } from '@/hooks/useUtils'

export function TrackQueuePage() {
  useDocumentTitle('Track queue')
  const [reference, setReference] = useState('')
  const [submitted, setSubmitted] = useState('')

  const query = useQuery({
    queryKey: ['public-queue', submitted],
    queryFn: () => publicApi.queue(submitted),
    enabled: Boolean(submitted),
    retry: false,
    refetchInterval: (current) => (current.state.data?.is_today ? 15_000 : false),
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = reference.trim().toUpperCase()
    if (value.length < 6) return
    setSubmitted(value)
    if (value === submitted) void query.refetch()
  }

  const errorStatus = (query.error as { response?: { status?: number } } | null)?.response?.status

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <Badge tone="mint" dot>
          Privacy-first tracking
        </Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Follow your live queue</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink-500">
          Enter the appointment reference from your confirmation. The public view shows queue details only — no patient
          name, email or phone number.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Appointment reference"
              placeholder="e.g. MQ-4K7P2X"
              icon={<KeyRound className="size-4" />}
              value={reference}
              onChange={(event) => setReference(event.target.value.toUpperCase())}
              hint="Find this in your booking confirmation or patient dashboard."
              containerClassName="flex-1"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" size="md" disabled={reference.trim().length < 6} loading={query.isFetching}>
              Track queue <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>

        {query.isLoading ? <QueueSkeleton className="mt-6" /> : null}

        {query.isError ? (
          <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-center shadow-soft">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="mt-3 text-sm font-bold text-ink-900">
              {errorStatus === 404 ? 'Reference not found' : 'Could not load this queue'}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-ink-500">
              {errorStatus === 404
                ? 'Check the reference and try again. References are case-insensitive and usually start with MQ-.'
                : getErrorMessage(query.error)}
            </p>
          </div>
        ) : null}

        {query.data ? (
          <div className="mt-6 animate-fade-up space-y-4">
            {!query.data.is_today ? (
              <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs leading-5 text-brand-700">
                <Clock3 className="mt-0.5 size-4 shrink-0" />
                This appointment is not today. Queue position becomes live on the appointment date after check-in.
              </div>
            ) : null}
            <QueueTracker data={query.data} />
            <p className="text-center text-[10px] text-ink-400">
              Updated {query.data.is_today ? 'every 15 seconds' : 'when opened'} · Reference {submitted}
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: UserRoundCheck, title: 'Sign in', text: 'See your queue from your dashboard.' },
            { icon: Radio, title: 'Auto-updates', text: 'The live view refreshes while open.' },
            { icon: ShieldCheck, title: 'No personal data', text: 'Only doctor, room and queue fields.' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-line bg-white p-4">
              <item.icon className="size-4 text-brand-500" />
              <p className="mt-2 text-[11px] font-bold text-ink-800">{item.title}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-ink-500">{item.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-400">
          Looking for your booking?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in to your patient dashboard
          </Link>{' '}
          or{' '}
          <Link to="/register" className={buttonClasses('ghost', 'sm', 'px-0 text-brand-600')}>
            create an account
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
