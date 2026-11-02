export type Role = 'patient' | 'doctor' | 'admin'

export type AppointmentStatus =
  | 'booked'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  role: Role
  is_active: boolean
  date_of_birth: string | null
  gender: string | null
  address: string | null
  created_at: string
}

export interface LoginResponse {
  user: User
  csrf_token: string
}

export interface Department {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  location: string
  phone: string
  accent: string
  is_active: boolean
  doctor_count: number
}

export interface Doctor {
  id: number
  user_id: number
  full_name: string
  email: string
  phone: string | null
  department_id: number
  department: Department
  designation: string
  qualifications: string
  bio: string
  consultation_fee: number
  avg_consult_minutes: number
  room_number: string
  experience_years: number
  languages: string
  is_active: boolean
  appointment_count?: number
  availability: AvailabilityBlock[]
}

export interface AvailabilityBlock {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  slot_minutes?: number
  is_active: boolean
}

export interface DoctorProfile extends Doctor {
  time_off: TimeOff[]
}

export interface TimeOff {
  id: number
  doctor_id: number
  start_date: string
  end_date: string
  reason: string | null
  created_at: string
}

export interface Slot {
  start_time: string
  end_time: string
  is_available: boolean
}

export interface Appointment {
  id: number
  reference: string
  patient_id: number
  patient_name: string
  patient_phone: string | null
  patient_email: string | null
  doctor_id: number
  doctor_name: string
  doctor_designation: string
  doctor_room: string
  department_name: string
  department_slug: string
  appointment_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  queue_number: number | null
  reason: string | null
  doctor_notes: string | null
  cancelled_reason: string | null
  created_at: string
  updated_at: string
}

export interface QueueEntry extends Appointment {
  position: number | null
  is_current: boolean
  eta_minutes: number | null
}

export interface PublicQueue {
  appointment: {
    reference: string
    doctor_name: string
    doctor_designation: string
    department_name: string
    room_number: string
    appointment_date: string
    start_time: string
    end_time: string
    status: AppointmentStatus
    queue_number: number | null
    checked_in_at: string | null
    called_at: string | null
    completed_at: string | null
    estimated_wait_minutes: number | null
    people_ahead: number | null
  }
  doctor: {
    name: string
    designation: string
    department: string
    room_number: string
    avg_consult_minutes: number
  }
  queue: {
    date: string
    current_number: number | null
    served: number
    waiting: number
    total: number
    progress: number
    is_active: boolean
  }
  people_ahead: number | null
  estimated_wait_minutes: number | null
  your_position: number | null
  is_today: boolean
}

export interface DashboardStats {
  upcoming: number
  completed: number
  cancelled: number
  today: number
  total: number
}

export interface PatientDashboard {
  stats: DashboardStats
  next_appointment: Appointment | null
  today_appointment: Appointment | null
  recent: Appointment[]
  queue: PublicQueue | null
  notifications: Notification[]
}

export interface DoctorDashboard {
  today: string
  stats: {
    today_total: number
    waiting: number
    checked_in: number
    in_progress: number
    completed: number
    no_show: number
  }
  current: Appointment | null
  next: Appointment | null
  waiting: Appointment[]
  completed: Appointment[]
  upcoming: Appointment[]
  weekly: { date: string; label: string; count: number }[]
  doctor: {
    id: number
    full_name: string
    specialization: string
    department_name: string
    room: string | null
    avatar_color: string
    avg_consult_minutes: number
  }
}

export interface AdminStats {
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
  recent_activity: Activity[]
  unread_messages: number
}

export interface PatientSummary {
  id: number
  full_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  is_active: boolean
  created_at: string
  appointment_count: number
  last_visit: string | null
}

export interface QueueOverview {
  date: string
  items: {
    doctor: {
      id: number
      full_name: string
      specialization: string
      department_name: string
      avatar_color: string
      room: string | null
    }
    stats: QueueCounts
    current: Appointment | null
  }[]
}

export interface Activity {
  id: number
  actor_id?: number | null
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: number | null
  description: string
  created_at: string
}

export interface Notification {
  id: number
  user_id?: number
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

export interface Schedule {
  doctor?: Doctor
  availability: AvailabilityBlock[]
  time_off: TimeOff[]
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ApiValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface ApiErrorBody {
  detail?: string | ApiValidationError[]
  message?: string
}


export interface QueueCounts {
  today_total: number
  waiting: number
  checked_in: number
  in_progress: number
  completed: number
  no_show: number
}

export interface DoctorQueue {
  date: string
  current: Appointment | null
  next: Appointment | null
  waiting: Appointment[]
  completed: Appointment[]
  stats: QueueCounts
  avg_consult_minutes: number
  last_updated: string | null
}

export interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  is_handled: boolean
  created_at: string
}


export interface CallNextResult {
  message: string
  appointment: Appointment | null
}

export interface Message {
  message: string
}
