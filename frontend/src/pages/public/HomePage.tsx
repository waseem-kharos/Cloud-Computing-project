import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicApi } from '@/api/endpoints'
import { ContactForm } from '@/components/domain/ContactForm'
import { DepartmentCard } from '@/components/domain/DepartmentCard'
import { DoctorCard } from '@/components/domain/DoctorCard'
import { Accordion } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses, Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useDocumentTitle } from '@/hooks/useUtils'
import { todayISO } from '@/lib/utils'

const steps = [
  {
    icon: Search,
    title: 'Find the right care',
    description: 'Browse departments or search by doctor, specialty and availability.',
  },
  {
    icon: CalendarCheck2,
    title: 'Choose a real slot',
    description: 'See published clinic times and book a confirmed appointment in seconds.',
  },
  {
    icon: BellRing,
    title: 'Arrive, then follow live',
    description: 'Check in at reception and follow your queue number from any device.',
  },
]

const features = [
  {
    icon: Clock3,
    title: 'Live queue clarity',
    description: 'Know who is being seen, how many people are ahead and a realistic wait estimate.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    description: 'Public queue lookup uses a random reference and never exposes patient identity.',
  },
  {
    icon: CalendarDays,
    title: 'Fewer scheduling clashes',
    description: 'Slot-level uniqueness keeps one active booking per doctor and time.',
  },
  {
    icon: UserRoundCheck,
    title: 'Built for every role',
    description: 'Patients book, doctors run the queue and administrators keep the service moving.',
  },
]

const faqs = [
  {
    question: 'How do I book an appointment?',
    answer:
      'Create a patient account, choose a department and doctor, then select an available date and time. Your appointment is confirmed immediately and appears in your dashboard.',
  },
  {
    question: 'How does the live queue work?',
    answer:
      'On the day of your visit, reception checks you in. Your queue number is based on your booked slot order, and the live view updates as the doctor calls patients forward.',
  },
  {
    question: 'Can I reschedule or cancel?',
    answer:
      'Yes. Upcoming appointments can be rescheduled to another available slot or cancelled from your patient dashboard. Your queue number is recalculated automatically.',
  },
  {
    question: 'Can anyone see my appointment details?',
    answer:
      'No. Public queue tracking requires your appointment reference and shows only queue-relevant details such as doctor, department, room and status — never your name or contact information.',
  },
  {
    question: 'Is this a real hospital?',
    answer:
      'No. MediQueue is a demonstration project with synthetic doctors, patients and schedules. It is not a real medical service and must not be used for emergencies.',
  },
]

export function HomePage() {
  useDocumentTitle()
  const navigate = useNavigate()
  const [departmentId, setDepartmentId] = useState('')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState(todayISO())

  const departments = useQuery({ queryKey: ['departments'], queryFn: publicApi.departments })
  const doctors = useQuery({
    queryKey: ['featured-doctors'],
    queryFn: () => publicApi.doctors({ page_size: 4, sort: 'experience' }),
  })

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (departmentId) params.set('department_id', departmentId)
    if (date) params.set('date', date)
    navigate(`/doctors?${params.toString()}`)
  }

  return (
    <>
      <section className="hero-atmosphere relative overflow-hidden">
        <div className="container-page grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <Badge tone="mint" dot className="px-3 py-1.5">
              Smarter hospital coordination
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-5xl lg:text-[56px]">
              Better Healthcare.
              <span className="block bg-gradient-to-r from-brand-600 via-brand-500 to-mint-500 bg-clip-text text-transparent">Less Waiting.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink-600 sm:text-base">
              Book your appointment, arrive with confidence and follow the live queue from your phone. MediQueue
              brings patients, doctors and hospital teams onto one calm, coordinated platform.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/register" className={buttonClasses('primary', 'lg')}>
                Book an appointment <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link to="/track-queue" className={buttonClasses('outline', 'lg')}>
                <Clock3 aria-hidden className="size-4" /> Track live queue
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-medium text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden className="size-3.5 text-mint-500" /> Instant confirmation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden className="size-3.5 text-mint-500" /> Real-time queue updates
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 aria-hidden className="size-3.5 text-mint-500" /> Private reference lookup
              </span>
            </div>

            <div className="mt-8 flex items-center gap-5 rounded-2xl border border-white bg-white/75 p-3.5 shadow-soft backdrop-blur sm:w-fit sm:gap-7">
              <div>
                <p className="text-xl font-bold text-ink-900">{departments.data?.length ?? '—'}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Specialties</p>
              </div>
              <span className="h-8 w-px bg-line" />
              <div>
                <p className="text-xl font-bold text-ink-900">{doctors.data?.total ?? '—'}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Doctors</p>
              </div>
              <span className="h-8 w-px bg-line" />
              <div>
                <p className="text-xl font-bold text-ink-900">6 days</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Clinic week</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:120ms] lg:max-w-none">
            <div className="hero-visual absolute -inset-6 rounded-[2.5rem] blur-xl" />
            <div className="pointer-events-none absolute -right-3 top-8 z-10 hidden size-14 items-center justify-center rounded-2xl border border-white bg-white/90 text-brand-600 shadow-lift lg:flex">
              <HeartPulse aria-hidden className="size-6" />
            </div>
            <div className="relative rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lift backdrop-blur-xl sm:p-5">
              <div className="rounded-2xl bg-ink-950 p-4 text-white sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-mint-300 ring-1 ring-white/10">
                      <HeartPulse className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">Cardiology OPD</p>
                      <p className="text-[10px] text-white/45">Room 204 · Dr. Ayesha Khan</p>
                    </div>
                  </div>
                  <Badge className="border-mint-400/20 bg-mint-400/10 text-mint-300" dot>
                    Live
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Now serving</p>
                    <p className="mt-1 text-2xl font-bold text-mint-300">18</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Your number</p>
                    <p className="mt-1 text-2xl font-bold">24</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Est. wait</p>
                    <p className="mt-1 text-lg font-bold">18 min</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-white/45">
                    <span>Queue progress</span>
                    <span>6 ahead</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[62%] rounded-full bg-mint-400" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-white/65">
                    <BellRing className="size-3.5 text-mint-300" /> We will notify you when you are next
                  </span>
                  <span className="text-[10px] font-semibold text-white/40">Auto</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-mint-600">
                    <BadgeCheck className="size-3.5" /> Appointment confirmed
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-ink-900">Dr. Ayesha Khan · 10:30 AM</p>
                  <p className="text-[10px] text-ink-400">Reference MQ-4K7P2X</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-mint-50 text-mint-600">
                  <CalendarCheck2 className="size-5" />
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-[10px] text-ink-400">Sample preview using synthetic data</p>
          </div>
        </div>

        <div className="container-page relative pb-12">
          <form
            onSubmit={onSearch}
            className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-lift sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-end lg:p-3"
          >
            <Input
              label="Doctor or specialty"
              placeholder="e.g. cardiology or Khan"
              icon={<Search className="size-4" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select label="Department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">All departments</option>
              {departments.data?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              label="Preferred date"
              value={date}
              min={todayISO()}
              onChange={(event) => setDate(event.target.value)}
            />
            <Button type="submit" size="md" className="lg:mb-0" trailingIcon={<ArrowRight className="size-4" />}>
              Check availability
            </Button>
          </form>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Clinical departments"
          title="Care for every part of life"
          description="Explore our demonstration specialties and find the team that fits your needs. Every profile and schedule is synthetic."
          action={
            <Link to="/departments" className={buttonClasses('outline', 'sm')}>
              All departments <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.isLoading
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} className="h-56" />)
            : departments.data?.slice(0, 6).map((department, index) => (
                <DepartmentCard key={department.id} department={department} index={index} />
              ))}
        </div>
      </section>

      <section className="border-y border-line bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Meet the team"
            title="Experienced doctors, clearer visits"
            description="Search by specialty, compare experience and book directly into a published clinic slot."
            action={
              <Link to="/doctors" className={buttonClasses('outline', 'sm')}>
                Find a doctor <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {doctors.isLoading
              ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} className="h-80" />)
              : doctors.data?.items.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from search to seen"
          description="No queues to guess, no repeat phone calls. Just a clear path from booking to your consultation."
          align="center"
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative rounded-2xl border border-line bg-white p-6 shadow-soft">
              <span className="absolute right-5 top-5 text-4xl font-bold text-ink-50">0{index + 1}</span>
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <step.icon aria-hidden className="size-5" />
              </span>
              <h3 className="mt-4 text-[15px] font-bold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-500">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/how-it-works" className={buttonClasses('ghost', 'sm')}>
            See the full patient journey <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-white py-16 sm:py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="blue">Why MediQueue</Badge>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
              Designed around the waiting room, not around paperwork
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Most appointment systems stop at the booking confirmation. MediQueue follows the visit through check-in,
              queue position and completion so everyone sees the same truth.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-line bg-canvas/60 p-4">
                  <feature.icon aria-hidden className="size-4 text-brand-600" />
                  <h3 className="mt-2.5 text-[13px] font-bold text-ink-900">{feature.title}</h3>
                  <p className="mt-1 text-[11px] leading-5 text-ink-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="grid-atmosphere rounded-3xl border border-line p-5 sm:p-8">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Today at a glance</p>
                    <p className="mt-1 text-sm font-bold text-ink-900">Your care timeline</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Stethoscope className="size-5" />
                  </span>
                </div>
                <ol className="mt-5 space-y-4">
                  {[
                    { title: 'Appointment booked', detail: 'Thu, 10:30 AM · Cardiology', done: true },
                    { title: 'Checked in at reception', detail: 'Queue number 24 assigned', done: true },
                    { title: 'Now serving 18', detail: '6 patients ahead · about 18 minutes', active: true },
                    { title: 'Consultation complete', detail: 'Visit summary available', done: false },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3">
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                          item.done
                            ? 'bg-mint-500 text-white'
                            : item.active
                              ? 'animate-pulse-ring bg-brand-600 text-white'
                              : 'border border-ink-200 bg-white text-ink-300'
                        }`}
                      >
                        {item.done ? <CheckCircle2 className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
                      </span>
                      <div>
                        <p className={`text-xs font-semibold ${item.active ? 'text-brand-700' : 'text-ink-800'}`}>
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-400">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-mint-50 px-3 py-2.5 text-[10px] font-medium text-mint-700">
                  <Users className="size-3.5" /> Everyone sees the same live status
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading eyebrow="Common questions" title="Answers before you arrive" />
            <p className="mt-4 text-sm leading-6 text-ink-500">
              Still unsure about something? Send a message and our demo team will help. For urgent medical concerns,
              contact local emergency services.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-mint-50 text-mint-600">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink-900">Try the demo accounts</p>
                <p className="mt-0.5 text-[11px] text-ink-500">Explore patient, doctor and admin workflows instantly.</p>
              </div>
              <Link to="/login" className={buttonClasses('outline', 'sm', 'ml-auto shrink-0')}>
                Login
              </Link>
            </div>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      <section className="border-t border-line bg-white py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Badge tone="mint">We are here to help</Badge>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
              Have a question about your visit?
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Send a message about appointments, departments or queue tracking. This demonstration form stores
              enquiries in the local database so administrators can review them.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-ink-600">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <CalendarDays className="size-4" />
                </span>
                Reception: Mon–Sat, 8:00 AM – 10:00 PM
              </p>
              <p className="flex items-center gap-2 text-ink-600">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Stethoscope className="size-4" />
                </span>
                Six demonstration specialties
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-canvas/50 p-5 sm:p-7">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
