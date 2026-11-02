import { Clock3, Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { ContactForm } from '@/components/domain/ContactForm'
import { Badge } from '@/components/ui/Badge'
import { useDocumentTitle } from '@/hooks/useUtils'

const details = [
  {
    icon: MapPin,
    title: 'Visit the demo campus',
    lines: ['MediQueue Demo Campus', '24 Wellness Avenue, Lahore'],
  },
  {
    icon: Phone,
    title: 'Call reception',
    lines: ['+92 42 555 0100', 'Mon–Sat, 8:00 AM – 10:00 PM'],
  },
  {
    icon: Mail,
    title: 'Email us',
    lines: ['hello@mediqueue.demo', 'We reply within one working day'],
  },
  {
    icon: Clock3,
    title: 'Reception hours',
    lines: ['Monday–Saturday', '8:00 AM – 10:00 PM'],
  },
]

export function ContactPage() {
  useDocumentTitle('Contact')
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <Badge tone="mint">Contact MediQueue</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
          Questions about your visit? We can help.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Reach the demonstration reception team about appointments, departments or queue tracking. For urgent medical
          concerns, contact local emergency services instead.
        </p>
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {details.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <item.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-ink-900">{item.title}</p>
                  {item.lines.map((line) => (
                    <p key={line} className="mt-0.5 text-[11px] leading-5 text-ink-500">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
            <div className="grid-atmosphere flex h-44 flex-col items-center justify-center text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-line">
                <MapPin className="size-6" />
              </span>
              <p className="mt-3 text-xs font-semibold text-ink-800">MediQueue Demo Campus</p>
              <p className="mt-0.5 text-[10px] text-ink-400">24 Wellness Avenue · Lahore</p>
              <p className="mt-2 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-medium text-ink-400">
                Illustration only · no live map
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-soft p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
              <MessageSquare className="size-3.5" /> This is a demonstration
            </p>
            <p className="mt-1 text-[10px] leading-5 text-amber-700">
              Messages are stored in a local demo database. Do not send real medical records, prescriptions or
              emergency requests.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-7">
          <h2 className="text-lg font-bold text-ink-900">Send a message</h2>
          <p className="mt-1 text-xs leading-5 text-ink-500">Share a question and the demo team will review it.</p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
