import { useQuery } from '@tanstack/react-query'
import { CalendarDays, FilterX, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { publicApi } from '@/api/endpoints'
import { DoctorCard } from '@/components/domain/DoctorCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useDebounced, useDocumentTitle } from '@/hooks/useUtils'
import { formatDate, todayISO } from '@/lib/utils'

export function DoctorsPage() {
  useDocumentTitle('Find doctors')
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const departmentId = params.get('department_id') || ''
  const sort = params.get('sort') || 'name'
  const date = params.get('date') || ''
  const page = Number(params.get('page') || 1)
  const debouncedSearch = useDebounced(search, 350)

  const departments = useQuery({ queryKey: ['departments'], queryFn: publicApi.departments })
  const doctors = useQuery({
    queryKey: ['public-doctors', debouncedSearch, departmentId, sort, page],
    queryFn: () =>
      publicApi.doctors({
        search: debouncedSearch || undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
        sort,
        page,
        page_size: 9,
      }),
  })

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const hasFilters = Boolean(search || departmentId || date)

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Our clinicians</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Find the right doctor</h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Search by name or specialty, filter by department and book into a published clinic slot. All profiles are
          synthetic demonstration data.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
          <Input
            label="Search"
            placeholder="Doctor name, specialty or language"
            icon={<Search className="size-4" />}
            value={search}
            onChange={(event) => update('search', event.target.value)}
          />
          <Select
            label="Department"
            value={departmentId}
            onChange={(event) => update('department_id', event.target.value)}
          >
            <option value="">All departments</option>
            {departments.data?.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <Select label="Sort by" value={sort} onChange={(event) => update('sort', event.target.value)}>
            <option value="name">Name (A–Z)</option>
            <option value="experience">Most experienced</option>
            <option value="fee">Fee: low to high</option>
          </Select>
          <div className="flex gap-2">
            {hasFilters ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setParams({}, { replace: true })}
                icon={<FilterX className="size-4" />}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {date ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-ink-500">
            <CalendarDays className="size-3.5 text-brand-500" />
            Booking links are pre-filled for <span className="font-semibold text-ink-800">{formatDate(date)}</span>
            <button type="button" onClick={() => update('date', '')} className="ml-1 font-semibold text-brand-600 hover:underline">
              Change date
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-500">
          {doctors.isLoading ? 'Searching doctors…' : `${doctors.data?.total ?? 0} doctors available`}
        </p>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-ink-400" />
          <Badge tone="slate">Verified demo profiles</Badge>
        </div>
      </div>

      {doctors.isLoading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} className="h-80" />
          ))}
        </div>
      ) : doctors.isError ? (
        <ErrorState
          className="mt-6"
          title="Could not load doctors"
          description={getErrorMessage(doctors.error)}
          onRetry={() => void doctors.refetch()}
        />
      ) : doctors.data?.items.length ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {doctors.data.items.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} date={date || undefined} />
            ))}
          </div>
          <Pagination
            className="mt-8"
            page={doctors.data.page}
            pages={doctors.data.pages}
            total={doctors.data.total}
            pageSize={doctors.data.page_size}
            onPageChange={(next) => update('page', String(next))}
          />
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-white shadow-soft">
          <EmptyState
            title="No doctors match those filters"
            description="Try a different department, broaden your search or clear all filters."
            action={
              <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                Reset filters
              </Button>
            }
          />
        </div>
      )}

      <p className="mt-6 text-[10px] text-ink-400">
        Preferred date shown for booking links: {date ? formatDate(date) : todayISO()}. Availability updates in real
        time as slots are booked.
      </p>
    </div>
  )
}
