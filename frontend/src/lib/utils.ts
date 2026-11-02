import { format, formatDistanceToNowStrict, isToday, isTomorrow, parseISO } from 'date-fns'
import type { AppointmentStatus, Role } from '@/api/types'

export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

export function formatDate(value: string | Date, pattern = 'EEE, dd MMM yyyy'): string {
  return format(toDate(value), pattern)
}

export function formatTime(value: string): string {
  const [hourString, minute] = value.split(':')
  const hour = Number(hourString)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minute} ${suffix}`
}

export function formatDateLong(value: string | Date): string {
  return formatDate(value, 'EEEE, d MMMM yyyy')
}

export function formatShortDate(value: string | Date): string {
  return formatDate(value, 'dd MMM')
}

export function friendlyDate(value: string | Date): string {
  const date = toDate(value)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return formatDate(date, 'EEE, dd MMM')
}

export function formatDateTime(value: string): string {
  return `${formatDate(value, 'dd MMM yyyy')} · ${formatTime(format(toDate(value), 'HH:mm'))}`
}

export function fromNow(value: string): string {
  return formatDistanceToNowStrict(toDate(value), { addSuffix: true })
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function addDaysISO(days: number): string {
  const next = new Date()
  next.setDate(next.getDate() + days)
  return format(next, 'yyyy-MM-dd')
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value)
}

export const statusLabels: Record<AppointmentStatus, string> = {
  booked: 'Booked',
  checked_in: 'Checked in',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
}

export const statusTone: Record<AppointmentStatus, 'blue' | 'amber' | 'mint' | 'slate' | 'rose'> = {
  booked: 'blue',
  checked_in: 'amber',
  in_progress: 'mint',
  completed: 'slate',
  cancelled: 'rose',
  no_show: 'rose',
}

export const activeStatuses: AppointmentStatus[] = ['booked', 'checked_in', 'in_progress']

export function isActiveStatus(status: AppointmentStatus): boolean {
  return activeStatuses.includes(status)
}

export const dashboardPath: Record<Role, string> = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin',
}

export const roleLabels: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Administrator',
}

export function waitLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'Not available'
  if (minutes <= 0) return 'You are next'
  if (minutes < 60) return `About ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `About ${hours} hr ${rest} min` : `About ${hours} hr`
}

export function safeNextPath(value: string | null, fallback = '/patient'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export function percent(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
