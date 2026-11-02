import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useUtils'

const sections = {
  privacy: {
    title: 'Privacy notice',
    intro:
      'MediQueue is a demonstration application. This notice explains what the demo stores and how the public queue view protects patient identity.',
    items: [
      {
        heading: 'What we store',
        body: 'Demo accounts include a name, email address, phone number, optional date of birth, gender and address, plus appointments, queue status, notifications and activity records. Do not enter real medical information.',
      },
      {
        heading: 'Public queue lookup',
        body: 'A public queue lookup requires an unguessable appointment reference. The response contains the doctor, department, room, appointment status and queue position. It never contains the patient’s name, email or phone number.',
      },
      {
        heading: 'Who can access what',
        body: 'Patients can access only their own appointments and profile. Doctors can access appointments and queues assigned to them. Administrators can access operational records needed to run the demonstration hospital.',
      },
      {
        heading: 'Cookies and sessions',
        body: 'Authentication uses an HttpOnly session cookie and a readable CSRF token cookie. The HttpOnly cookie cannot be read by JavaScript. Sessions are invalidated when you sign out.',
      },
      {
        heading: 'Data retention',
        body: 'This is a local demonstration database. Data may be reset or deleted at any time. Do not use this application for real clinical, personal or emergency information.',
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    intro:
      'By using MediQueue you acknowledge that this is a software demonstration with synthetic hospital data, not a real medical service.',
    items: [
      {
        heading: 'Demonstration only',
        body: 'Doctors, patients, schedules, contact details and queue data are synthetic. MediQueue does not provide medical advice, diagnosis, treatment or emergency services.',
      },
      {
        heading: 'No emergency use',
        body: 'If you or someone else has a medical emergency, contact local emergency services immediately. Do not wait for a response through this demo.',
      },
      {
        heading: 'Account responsibility',
        body: 'Keep your demo credentials private and use synthetic information only. Do not attempt to access another user’s account or disrupt the service.',
      },
      {
        heading: 'Availability',
        body: 'The demo may be changed, restarted or taken offline without notice. Appointments and records may be reset during development.',
      },
      {
        heading: 'Acceptable use',
        body: 'Do not use the application to store real health records, send abusive content, probe for vulnerabilities or misrepresent the service as a real hospital.',
      },
    ],
  },
}

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const location = useLocation()
  const type: 'privacy' | 'terms' = location.pathname.includes('privacy') ? 'privacy' : kind
  const content = sections[type]
  useDocumentTitle(content.title)

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-700">
          <ArrowLeft className="size-3.5" /> Back home
        </Link>
        <div className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-9">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-950">{content.title}</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500">{content.intro}</p>
          <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-[11px] font-medium text-amber-800">
            Last updated: demonstration build · Not legal advice
          </p>

          <div className="mt-8 space-y-6">
            {content.items.map((item, index) => (
              <section key={item.heading}>
                <h2 className="text-sm font-bold text-ink-900">
                  {index + 1}. {item.heading}
                </h2>
                <p className="mt-1.5 text-[13px] leading-6 text-ink-500">{item.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-2 border-t border-line pt-6">
            <Link to={type === 'privacy' ? '/terms' : '/privacy'} className={buttonClasses('outline', 'sm')}>
              Read {type === 'privacy' ? 'terms of use' : 'privacy notice'}
            </Link>
            <Link to="/contact" className={buttonClasses('ghost', 'sm')}>
              Contact the demo team
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
