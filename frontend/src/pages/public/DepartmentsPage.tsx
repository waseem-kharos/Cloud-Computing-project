import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CalendarPlus, MapPin, Phone, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { publicApi } from '@/api/endpoints'
import { DepartmentCard } from '@/components/domain/DepartmentCard'
import { DepartmentIcon } from '@/components/domain/DepartmentIcon'
import { DoctorCard } from '@/components/domain/DoctorCard'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { useDocumentTitle } from '@/hooks/useUtils'

export function DepartmentsPage() {
  useDocumentTitle('Departments')
  const departments = useQuery({ queryKey: ['departments'], queryFn: publicApi.departments })

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Our specialties</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">
          Care organised around you
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Explore each department, meet its doctors and book directly into available clinics. Every department here is
          part of the MediQueue demonstration hospital.
        </p>
      </div>

      {departments.isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} className="h-56" />
          ))}
        </div>
      ) : departments.isError || !departments.data ? (
        <ErrorState
          className="mt-8"
          title="Could not load departments"
          onRetry={() => void departments.refetch()}
        />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.data.map((department, index) => (
              <DepartmentCard key={department.id} department={department} index={index} />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="max-w-xl">
                <Badge tone="mint">Not sure where to start?</Badge>
                <h2 className="mt-3 text-lg font-bold text-ink-900">Find a doctor by name or concern</h2>
                <p className="mt-1 text-[13px] leading-6 text-ink-500">
                  Search all clinicians at once, compare experience and fees, then choose a time that works for you.
                </p>
              </div>
              <Link to="/doctors" className={buttonClasses('primary', 'md')}>
                <Search className="size-4" /> Search doctors
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function DepartmentDetailPage() {
  const { slug } = useParams()
  const departments = useQuery({ queryKey: ['departments'], queryFn: publicApi.departments })
  const department = departments.data?.find((item) => item.slug === slug)

  const doctors = useQuery({
    queryKey: ['department-doctors', department?.id],
    queryFn: () => publicApi.doctors({ department_id: department!.id, page_size: 12 }),
    enabled: Boolean(department?.id),
  })

  useDocumentTitle(department?.name || 'Department')

  if (departments.isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-6 h-48 w-full rounded-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="h-80" />
          ))}
        </div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Department not found" description="This specialty may have been moved or renamed." />
        <div className="mt-4 text-center">
          <Link to="/departments" className={buttonClasses('outline', 'sm')}>
            <ArrowLeft className="size-3.5" /> All departments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <Link to="/departments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-700">
        <ArrowLeft className="size-3.5" /> All departments
      </Link>

      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <div className="grid-atmosphere px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-line">
                <DepartmentIcon name={department.icon} className="size-7" />
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-950">{department.name}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-500">{department.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-ink-500">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5">
                  <MapPin className="size-3.5 text-brand-500" /> {department.location}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5">
                  <Phone className="size-3.5 text-brand-500" /> {department.phone}
                </span>
                <span className="rounded-full border border-line bg-white px-3 py-1.5 font-semibold text-ink-700">
                  {department.doctor_count} doctors
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/doctors?department_id=${department.id}`} className={buttonClasses('primary', 'md')}>
                <CalendarPlus className="size-4" /> Book in this department
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-950">Doctors in {department.name}</h2>
          <p className="mt-1 text-xs text-ink-500">Compare profiles and available clinic slots.</p>
        </div>
        <Link to="/doctors" className="hidden items-center gap-1 text-xs font-semibold text-brand-600 hover:underline sm:flex">
          All doctors <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {doctors.isLoading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="h-80" />
          ))}
        </div>
      ) : doctors.data?.items.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.data.items.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
          <p className="text-sm font-semibold text-ink-900">No doctors are listed in this department yet.</p>
          <p className="mt-1 text-xs text-ink-500">Please check another specialty or contact reception.</p>
        </div>
      )}
    </div>
  )
}
