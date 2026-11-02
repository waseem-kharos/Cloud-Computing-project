import { ArrowUpRight, Award, CalendarPlus, Languages, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Doctor } from '@/api/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { DepartmentIcon } from '@/components/domain/DepartmentIcon'
import { formatCurrency } from '@/lib/utils'

export function DoctorCard({ doctor, compact, date }: { doctor: Doctor; compact?: boolean; date?: string }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
      <div className={compact ? 'p-5' : 'p-5 sm:p-6'}>
        <div className="flex items-start gap-3.5">
          <div className="relative">
            <Avatar name={doctor.full_name} size="lg" />
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-mint-500 text-white">
              <Award aria-hidden className="size-2.5" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="truncate text-[15px] font-bold text-ink-900">{doctor.full_name}</h3>
                <p className="mt-0.5 text-xs font-medium text-brand-600">{doctor.designation}</p>
              </div>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-ink-300 transition group-hover:text-brand-500"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="blue">
                <DepartmentIcon name={doctor.department.icon} className="size-3" />
                {doctor.department.name}
              </Badge>
              {doctor.is_active ? <Badge tone="mint" dot>Available</Badge> : <Badge tone="slate">Unavailable</Badge>}
            </div>
          </div>
        </div>

        {!compact ? <p className="mt-4 line-clamp-2 text-[13px] leading-5 text-ink-500">{doctor.bio}</p> : null}

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-ink-50 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Experience</dt>
            <dd className="mt-0.5 font-semibold text-ink-800">{doctor.experience_years} years</dd>
          </div>
          <div className="rounded-lg bg-ink-50 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Consultation</dt>
            <dd className="mt-0.5 font-semibold text-ink-800">{formatCurrency(doctor.consultation_fee)}</dd>
          </div>
        </dl>

        {!compact ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3" /> Room {doctor.room_number}
            </span>
            <span className="inline-flex items-center gap-1">
              <Languages aria-hidden className="size-3" /> {doctor.languages}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-line bg-ink-50/50 px-5 py-3.5">
        <Link
          to={`/doctors/${doctor.id}`}
          className={buttonClasses('outline', 'sm', 'flex-1')}
          aria-label={`View profile for ${doctor.full_name}`}
        >
          View profile
        </Link>
        <Link
          to={`/book?doctor=${doctor.id}${date ? `&date=${date}` : ''}`}
          className={buttonClasses('primary', 'sm', 'flex-1')}
          aria-label={`Book an appointment with ${doctor.full_name}`}
        >
          <CalendarPlus aria-hidden className="size-3.5" />
          Book
        </Link>
      </div>
    </article>
  )
}
