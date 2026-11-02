import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-ink-500">
            A demonstration hospital appointment and live queue platform built to show how thoughtful digital
            coordination can reduce waiting-room uncertainty.
          </p>
          <div className="mt-5 space-y-2 text-[13px] text-ink-500">
            <p className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-500" />
              MediQueue Demo Campus, 24 Wellness Avenue, Lahore
            </p>
            <p className="flex items-center gap-2">
              <Phone aria-hidden className="size-4 shrink-0 text-brand-500" /> +92 42 555 0100
            </p>
            <p className="flex items-center gap-2">
              <Mail aria-hidden className="size-4 shrink-0 text-brand-500" /> hello@mediqueue.demo
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-[13px] text-ink-500">
            {[
              ['Find a doctor', '/doctors'],
              ['Departments', '/departments'],
              ['How it works', '/how-it-works'],
              ['Track your queue', '/track-queue'],
              ['Contact us', '/contact'],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="transition hover:text-brand-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900">Patients</h2>
          <ul className="mt-4 space-y-2.5 text-[13px] text-ink-500">
            {[
              ['Book an appointment', '/book'],
              ['Patient dashboard', '/patient'],
              ['Create an account', '/register'],
              ['Privacy notice', '/privacy'],
              ['Terms of use', '/terms'],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="transition hover:text-brand-700">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-700">
              <Clock aria-hidden className="size-3.5" /> Demo reception hours
            </p>
            <p className="mt-1 text-[11px] text-ink-500">Mon–Sat, 8:00 AM – 10:00 PM</p>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-5 text-[11px] text-ink-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} MediQueue. Built for demonstration and academic use.</p>
          <p className="rounded-full bg-amber-soft px-3 py-1 text-amber-700">
            Demo data only — not a real medical service or emergency channel.
          </p>
        </div>
        <div className="container-page pb-6">
          <p className="text-[10px] leading-5 text-ink-400">
            In an emergency, contact your local emergency services immediately. MediQueue does not provide medical
            advice, diagnosis or treatment.
          </p>
        </div>
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:right-4 focus:z-50 focus:flex focus:items-center focus:gap-1.5 focus:rounded-lg focus:bg-ink-900 focus:px-3 focus:py-2 focus:text-xs focus:text-white"
      >
        Back to top <ArrowUpRight className="size-3.5" />
      </a>
    </footer>
  )
}
