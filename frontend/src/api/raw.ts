import type { AppointmentStatus, Role } from './types'

export interface RawPage<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface RawDepartment {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  accent: string
  is_active: boolean
  doctor_count: number
}

export interface RawDepartmentBrief {
  id: number
  name: string
  slug: string
  icon: string
  accent: string
}

export interface RawAvailability {
  id: number
  weekday: number
  start_time: string
  end_time: string
  slot_minutes: number
  is_active: boolean
}

export interface RawDoctorBrief {
  id: number
  full_name: string
  specialization: string
  department_id: number
  department_name: string
  avatar_color: string
  room: string | null
  avg_consult_minutes: number
}

export interface RawPublicDoctor extends RawDoctorBrief {
  qualifications: string | null
  experience_years: number
  bio: string | null
  consultation_fee: number
  availability: RawAvailability[]
  department: RawDepartmentBrief | null
}

export interface RawAdminDoctor extends RawPublicDoctor {
  user_id: number
  email: string
  phone: string | null
  is_active: boolean
  appointment_count: number
}

export interface RawSlot {
  time: string
  available: boolean
  queue_number: number | null
  reason: string | null
}

export interface RawPatientBrief {
  id: number
  full_name: string
  phone: string | null
  email: string | null
  date_of_birth: string | null
  gender: string | null
}

export interface RawAppointment {
  id: number
  reference_code: string
  appointment_date: string
  slot_time: string
  duration_minutes: number
  queue_number: number
  status: AppointmentStatus
  reason: string | null
  doctor_notes: string | null
  created_at: string | null
  doctor: RawDoctorBrief
  department: RawDepartmentBrief
  patient: RawPatientBrief | null
}

export interface RawQueueStatus {
  appointment_id: number
  reference_code: string
  appointment_date: string
  slot_time: string
  status: AppointmentStatus
  queue_number: number
  doctor_id: number
  doctor_name: string
  doctor_specialization: string
  doctor_room: string | null
  department_name: string
  current_serving: number | null
  patients_ahead: number
  total_in_queue: number
  estimated_wait_minutes: number
  avg_consult_minutes: number
  progress_percent: number
  updated_at: string | null
}

export interface RawPublicQueue {
  reference_code: string
  appointment_date: string
  slot_time: string
  status: AppointmentStatus
  queue_number: number
  doctor_name: string
  doctor_specialization: string
  doctor_room: string | null
  department_name: string
  current_serving: number | null
  patients_ahead: number
  total_in_queue: number
  estimated_wait_minutes: number
  avg_consult_minutes: number
  progress_percent: number
}

export interface RawNotification {
  id: number
  title: string
  message: string
  category: string
  link: string | null
  is_read: boolean
  created_at: string | null
}

export interface RawNotificationList {
  items: RawNotification[]
  unread: number
}

export interface RawPatientStats {
  upcoming: number
  completed: number
  cancelled: number
  total: number
}

export interface RawPatientDashboard {
  stats: RawPatientStats
  next_appointment: RawAppointment | null
  active_queue: RawQueueStatus | null
  recent_appointments: RawAppointment[]
  notifications: RawNotification[]
  unread_notifications: number
}

export interface RawDoctorDashboard {
  today: string
  stats: Record<string, number>
  current: RawAppointment | null
  next: RawAppointment | null
  waiting: RawAppointment[]
  completed: RawAppointment[]
  upcoming: RawAppointment[]
  weekly: { date: string; label: string; count: number }[]
  doctor: RawDoctorBrief
}

export interface RawQueueCounts {
  today_total: number
  waiting: number
  checked_in: number
  in_progress: number
  completed: number
  no_show: number
}

export interface RawDoctorQueue {
  date: string
  current: RawAppointment | null
  next: RawAppointment | null
  waiting: RawAppointment[]
  completed: RawAppointment[]
  stats: RawQueueCounts
  avg_consult_minutes: number
  last_updated: string | null
}

export interface RawQueueDoctor {
  id: number
  full_name: string
  specialization: string
  department_name: string
  avatar_color: string
  room: string | null
}

export interface RawQueueOverview {
  date: string
  items: {
    doctor: RawQueueDoctor
    stats: RawQueueCounts
    current: RawAppointment | null
  }[]
}

export interface RawCallNext {
  message: string
  appointment: RawAppointment | null
}

export interface RawAdminStats {
  total_patients: number
  total_doctors: number
  total_appointments: number
  today_appointments: number
  upcoming_appointments: number
  cancelled_appointments: number
  completed_appointments: number
  active_queues: number
  bookings_last_7_days: { date: string; label: string; count: number }[]
  status_distribution: { name: string; value: number }[]
  department_distribution: { name: string; value: number }[]
  recent_activity: RawActivity[]
  unread_messages: number
}

export interface RawActivity {
  id: number
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: number | null
  detail: string | null
  created_at: string | null
}

export interface RawAdminUser {
  id: number
  email: string
  full_name: string
  phone: string | null
  role: Role
  is_active: boolean
  date_of_birth: string | null
  gender: string | null
  created_at: string | null
  appointment_count: number
}

export interface RawTimeOff {
  id: number
  off_date: string
  reason: string | null
}

export interface RawSchedule {
  doctor?: RawAdminDoctor
  availability: RawAvailability[]
  time_off: RawTimeOff[]
}

export interface RawContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  is_handled: boolean
  created_at: string | null
}

export interface RawMessage {
  message: string
}
