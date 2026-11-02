import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CalendarSearch,
  CheckCircle2,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Accordion } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useDocumentTitle } from '@/hooks/useUtils'

const patientSteps = [
  {
    icon: CalendarSearch,
    title: 'Explore care options',
    text: 'Start with a department or search all doctors. Compare experience, languages, consultation fee and clinic days.',
  },
  {
    icon: CalendarCheck2,
    title: 'Pick a real time slot',
    text: 'Availability is generated from the doctor’s published weekly schedule, excluding booked slots and time off.',
  },
  {
    icon: CheckCircle2,
    title: 'Confirm in a few taps',
    text: 'Sign in, add a short reason for your visit, review the details and receive an instant confirmation with a reference.',
  },
  {
    icon: Clock3,
    title: 'Follow the live queue',
    text: 'On the day, reception checks you in. Your number, position and estimated wait update as the clinic progresses.',
  },
]

const roleCards = [
  {
    icon: UserRoundCheck,
    title: 'For patients',
    points: ['Book and reschedule visits', 'See status and queue position', 'Cancel when plans change', 'Notification updates'],
    tone: 'brand' as const,
  },
  {
    icon: Stethoscope,
    title: 'For doctors',
    points: ['Run a simple daily queue', 'Call the next patient', 'Update visit status and notes', 'Manage clinics and time off'],
    tone: 'mint' as const,
  },
  {
    icon: ShieldCheck,
    title: 'For administrators',
    points: ['Oversee all appointments', 'Add doctors and departments', 'Monitor every live queue', 'Review activity and messages'],
    tone: 'violet' as const,
  },
]

const faqs = [
  {
    question: 'When should I arrive?',
    answer: 'Please arrive about 10 minutes before your appointment slot so reception can check you in without delaying the clinic.',
  },
  {
    question: 'What happens if I am late?',
    answer: 'Reception can still check you in while the clinic is active, but your original queue position may no longer be guaranteed. The doctor or reception team makes the final call.',
  },
  {
    question: 'Does the queue number mean my exact appointment time?',
    answer: 'Your queue number is based on the order of booked slots, but consultation length varies. Use the live estimate as a guide, not a guarantee.',
  },
  {
    question: 'Can I track someone else’s queue?',
    answer: 'Only with their appointment reference. Public tracking deliberately shows no patient name, email or phone number.',
  },
  {
    question: 'Is the demo data real?',
    answer: 'No. Doctors, patients, contact details and schedules are synthetic. MediQueue is a software demonstration, not a real hospital service.',
  },
]

export function HowItWorksPage() {
  useDocumentTitle('How it works')
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <Badge tone="blue">The MediQueue journey</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
          From “I need an appointment” to “I’m next”
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          A clear, shared workflow for patients, doctors and hospital administrators — with fewer phone calls and no
          guessing in the waiting room.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/register" className={buttonClasses('primary', 'md')}>
            Book an appointment <ArrowRight className="size-4" />
          </Link>
          <Link to="/track-queue" className={buttonClasses('outline', 'md')}>
            Try queue tracking
          </Link>
        </div>
      </div>

      <section className="mt-14">
        <SectionHeading eyebrow="For patients" title="A simple four-step visit" align="center" />
        <div className="relative mt-9 grid gap-4 lg:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-11 hidden h-px bg-line lg:block" />
          {patientSteps.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-line bg-white p-5 text-center shadow-soft">
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/25">
                <step.icon className="size-5" />
              </span>
              <span className="mt-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-brand-500">
                Step {index + 1}
              </span>
              <h3 className="mt-1 text-sm font-bold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-[11px] leading-5 text-ink-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-9">
        <SectionHeading
          eyebrow="One source of truth"
          title="Each role gets the right view"
          description="Role-based access keeps the workflow focused and the data protected."
        />
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {roleCards.map((role) => (
            <div key={role.title} className="rounded-2xl border border-line bg-canvas/50 p-5">
              <span
                className={`flex size-10 items-center justify-center rounded-xl ${
                  role.tone === 'brand'
                    ? 'bg-brand-50 text-brand-600'
                    : role.tone === 'mint'
                      ? 'bg-mint-50 text-mint-600'
                      : 'bg-violet-50 text-violet-600'
                }`}
              >
                <role.icon className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-ink-900">{role.title}</h3>
              <ul className="mt-3 space-y-2">
                {role.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[11px] leading-5 text-ink-500">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-mint-500" /> {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading eyebrow="Queue, explained" title="What the live view actually shows" />
          <div className="mt-5 space-y-4">
            {[
              { icon: BellRing, title: 'Now serving', text: 'The queue number currently with the doctor.' },
              { icon: Clock3, title: 'Estimated wait', text: 'People ahead multiplied by the doctor’s average consultation time — a guide, not a promise.' },
              { icon: HeartPulse, title: 'Status changes', text: 'Booked, checked in, in progress, completed, cancelled or no show.' },
              { icon: ShieldCheck, title: 'Private reference', text: 'Public lookup exposes queue details only, never patient identity.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-ink-900">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Questions" title="Good to know" />
          <Accordion className="mt-5" items={faqs} />
        </div>
      </section>

      <section className="mt-14 rounded-3xl bg-ink-950 px-6 py-10 text-center text-white sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight">Ready to try the full flow?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/55">
          Create a patient account or use a demo login to explore the doctor and administrator workspaces.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/register" className={buttonClasses('primary', 'md')}>
            Create account
          </Link>
          <Link to="/login" className={buttonClasses('outline', 'md', 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white')}>
            Use a demo account
          </Link>
        </div>
      </section>
    </div>
  )
}
