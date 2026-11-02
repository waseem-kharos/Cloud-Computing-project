import { ArrowLeft, CalendarCheck2, Clock3, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'

const benefits = [
  { icon: CalendarCheck2, title: 'Confirmed appointments', text: 'Real slots, instant confirmation and easy rescheduling.' },
  { icon: Clock3, title: 'Live queue visibility', text: 'Follow your position and estimated wait from any device.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'Patients, doctors and administrators each see only what they need.' },
]

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: ReactNode
  subtitle: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-gradient-to-br from-white via-white to-brand-50/60 lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:px-14 lg:py-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="MediQueue home">
            <Logo />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-700">
            <ArrowLeft className="size-3.5" /> Back home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-ink-500">{subtitle}</p>
          </div>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 text-center text-xs text-ink-500">{footer}</div> : null}
        </div>

        <div className="mx-auto w-full max-w-md">
          <p className="text-[10px] leading-5 text-ink-400">
            Demonstration environment. Use synthetic information only. For urgent medical concerns contact local
            emergency services.
          </p>
        </div>
      </div>

      <div className="relative m-3 hidden overflow-hidden rounded-[2rem] shadow-lift lg:block">
        <div className="mesh-dark absolute inset-0" />
        <div className="pointer-events-none absolute -right-28 top-1/4 size-[28rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-16 top-[30%] size-80 rounded-full border border-white/[0.07]" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
              <span className="size-1.5 rounded-full bg-mint-400" /> MediQueue care platform
            </span>
            <h2 className="mt-6 max-w-lg text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              A calmer hospital visit starts before you arrive.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
              One account connects your bookings, live queue and visit history — without the waiting-room guesswork.
            </p>
          </div>

          <div className="max-w-md space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-mint-300">
                  <benefit.icon className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">{benefit.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-white/45">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['AK', 'MH', 'SR', 'ZN'].map((initials, index) => (
                <span
                  key={initials}
                  className={`flex size-8 items-center justify-center rounded-full border-2 border-ink-950 text-[9px] font-bold text-white ${
                    ['bg-brand-500', 'bg-mint-500', 'bg-violet-500', 'bg-rose-500'][index]
                  }`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-white/40">Synthetic accounts for demonstration</p>
          </div>
        </div>
      </div>
    </div>
  )
}
