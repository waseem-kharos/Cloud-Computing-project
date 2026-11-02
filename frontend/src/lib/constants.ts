import type { AppointmentStatus } from '@/api/types'

export const BRAND_NAME = 'MediQueue' as const

export const WEEKDAYS = [
  { value: 0, short: 'Mon', label: 'Monday' },
  { value: 1, short: 'Tue', label: 'Tuesday' },
  { value: 2, short: 'Wed', label: 'Wednesday' },
  { value: 3, short: 'Thu', label: 'Thursday' },
  { value: 4, short: 'Fri', label: 'Friday' },
  { value: 5, short: 'Sat', label: 'Saturday' },
  { value: 6, short: 'Sun', label: 'Sunday' },
] as const

export const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'booked', label: 'Booked' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
]

export const DEMO_ACCOUNTS = [
  {
    role: 'Patient' as const,
    email: 'patient@mediqueue.demo',
    password: 'Patient@12345',
    description: 'Book visits, track your live queue and manage appointments.',
  },
  {
    role: 'Doctor' as const,
    email: 'ayesha.khan@mediqueue.demo',
    password: 'Doctor@12345',
    description: 'Run today’s queue, update visit status and manage availability.',
  },
  {
    role: 'Admin' as const,
    email: 'admin@mediqueue.demo',
    password: 'Admin@12345',
    description: 'Oversee doctors, patients, departments and every queue.',
  },
]

export const DEPARTMENT_ICONS = [
  'HeartPulse',
  'Brain',
  'Bone',
  'Baby',
  'Stethoscope',
  'Eye',
  'Ear',
  'Activity',
] as const

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/doctors', label: 'Find Doctors' },
  { to: '/departments', label: 'Departments' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/contact', label: 'Contact' },
]
