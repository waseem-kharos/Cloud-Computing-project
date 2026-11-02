import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { format } from 'date-fns'

export function DoctorHero() {
  const { user } = useAuth()
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.full_name?.split(' ').slice(-1)[0] || user?.full_name || 'Doctor'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#bfdbfe] bg-gradient-to-r from-[#eff6ff] via-[#f8fbff] to-[#ecfdf5] shadow-soft">
      <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="blue">Clinical Workspace</Badge>
            <Badge tone="slate">{format(now, 'EEE, dd MMM yyyy • HH:mm')}</Badge>
          </div>
          <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">
            {greeting}, Dr. {name} ??
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Here is your overview for today�s consultations and queue.
          </p>
        </div>
        <div className="hidden h-24 w-32 sm:block">
          <svg viewBox="0 0 128 96" role="img" aria-label="Doctor illustration">
            <circle cx="64" cy="28" r="16" fill="#bfdbfe" />
            <rect x="44" y="44" width="40" height="28" rx="14" fill="#93c5fd" />
            <rect x="52" y="52" width="8" height="12" rx="4" fill="#2563eb" />
            <rect x="68" y="52" width="8" height="12" rx="4" fill="#2563eb" />
          </svg>
        </div>
      </div>
    </div>
  )
}
