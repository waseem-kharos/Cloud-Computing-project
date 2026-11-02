import { ArrowRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Department } from '@/api/types'
import { DepartmentIcon } from './DepartmentIcon'

const accents = [
  'from-brand-50 to-brand-100/40 text-brand-600',
  'from-mint-50 to-mint-100/40 text-mint-600',
  'from-violet-50 to-violet-100/40 text-violet-600',
  'from-rose-50 to-rose-100/40 text-rose-600',
  'from-amber-50 to-amber-100/40 text-amber-600',
  'from-cyan-50 to-cyan-100/40 text-cyan-600',
]

export function DepartmentCard({ department, index = 0 }: { department: Department; index?: number }) {
  return (
    <Link
      to={`/departments/${department.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset ring-white/70 ${accents[index % accents.length]}`}
        >
          <DepartmentIcon name={department.icon} />
        </span>
        <span className="rounded-full bg-ink-50 px-2.5 py-1 text-[10px] font-semibold text-ink-500">
          {department.doctor_count} {department.doctor_count === 1 ? 'doctor' : 'doctors'}
        </span>
      </div>
      <h3 className="mt-4 text-[15px] font-bold text-ink-900 group-hover:text-brand-700">{department.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-ink-500">{department.description}</p>
      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
          <MapPin aria-hidden className="size-3" /> {department.location}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
          Explore <ArrowRight aria-hidden className="size-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
