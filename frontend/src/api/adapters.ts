import type {
  Activity,
  AdminStats,
  Appointment,
  AvailabilityBlock,
  ContactMessage,
  Department,
  Doctor,
  DoctorDashboard,
  DoctorProfile,
  DoctorQueue,
  Notification,
  PatientDashboard,
  PatientSummary,
  PublicQueue,
  QueueOverview,
  Schedule,
  Slot,
  TimeOff,
  User,
} from './types'
import type {
  RawActivity,
  RawAdminDoctor,
  RawAdminStats,
  RawAdminUser,
  RawAppointment,
  RawContactMessage,
  RawDepartment,
  RawDepartmentBrief,
  RawDoctorBrief,
  RawDoctorDashboard,
  RawDoctorQueue,
  RawNotification,
  RawPatientDashboard,
  RawPublicDoctor,
  RawPublicQueue,
  RawQueueOverview,
  RawQueueStatus,
  RawSchedule,
  RawSlot,
  RawTimeOff,
} from './raw'

const DEPARTMENT_LOCATIONS: Record<string, string> = {
  cardiology: 'MediCampus · Heart Centre, Level 2',
  'general-medicine': 'MediCampus · Main Block, Level 1',
  pediatrics: 'MediCampus · Family Wing, Level 1',
  dermatology: 'MediCampus · Skin & Laser Clinic, Level 3',
  orthopedics: 'MediCampus · Bone & Joint Centre, Level 2',
  'ent-specialist': 'MediCampus · ENT Clinic, Level 2',
}

export function todayISO(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return time
  const total = Math.max(0, Math.min(23 * 60 + 59, hours * 60 + mins + minutes))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function fallbackDepartment(brief: RawDepartmentBrief | null): Department {
  if (!brief) {
    return {
      id: 0,
      name: 'General Medicine',
      slug: 'general-medicine',
      description: '',
      icon: 'Stethoscope',
      location: 'MediCampus · Main Block',
      phone: '+92 42 555 0100',
      accent: 'blue',
      is_active: true,
      doctor_count: 0,
    }
  }
  return adaptDepartment({ ...brief, description: '', is_active: true, doctor_count: 0 })
}

export function adaptDepartment(raw: RawDepartment): Department {
  return {
    ...raw,
    location: DEPARTMENT_LOCATIONS[raw.slug] || 'MediCampus · Outpatient Wing',
    phone: '+92 42 555 0100',
  }
}

export function adaptAvailability(raw: {
  id: number
  weekday: number
  start_time: string
  end_time: string
  slot_minutes?: number
  is_active: boolean
}): AvailabilityBlock {
  return {
    id: raw.id,
    day_of_week: raw.weekday,
    start_time: raw.start_time,
    end_time: raw.end_time,
    slot_minutes: raw.slot_minutes ?? 15,
    is_active: raw.is_active,
  }
}

export function adaptDoctor(raw: RawPublicDoctor | RawAdminDoctor): Doctor {
  const admin = 'email' in raw ? raw : null
  return {
    id: raw.id,
    user_id: admin?.user_id ?? 0,
    full_name: raw.full_name,
    email: admin?.email ?? '',
    phone: admin?.phone ?? null,
    department_id: raw.department_id,
    department: fallbackDepartment(raw.department),
    designation: raw.specialization,
    qualifications: raw.qualifications || 'MBBS',
    bio: raw.bio || '',
    consultation_fee: raw.consultation_fee,
    avg_consult_minutes: raw.avg_consult_minutes,
    room_number: raw.room || 'Reception',
    experience_years: raw.experience_years,
    languages: 'English · Urdu',
    is_active: admin?.is_active ?? true,
    appointment_count: admin?.appointment_count,
    availability: (raw.availability || []).map(adaptAvailability),
  }
}

export function adaptDoctorProfile(raw: RawAdminDoctor, timeOff: RawTimeOff[] = []): DoctorProfile {
  return {
    ...adaptDoctor(raw),
    time_off: timeOff.map(adaptTimeOff),
  }
}

export function adaptTimeOff(raw: RawTimeOff): TimeOff {
  return {
    id: raw.id,
    doctor_id: 0,
    start_date: raw.off_date,
    end_date: raw.off_date,
    reason: raw.reason,
    created_at: '',
  }
}

export function adaptSlot(raw: RawSlot): Slot {
  return {
    start_time: raw.time,
    end_time: addMinutes(raw.time, 15),
    is_available: raw.available,
  }
}

export function adaptAppointment(raw: RawAppointment): Appointment {
  return {
    id: raw.id,
    reference: raw.reference_code,
    patient_id: raw.patient?.id ?? 0,
    patient_name: raw.patient?.full_name || 'Patient',
    patient_phone: raw.patient?.phone ?? null,
    patient_email: raw.patient?.email ?? null,
    doctor_id: raw.doctor.id,
    doctor_name: raw.doctor.full_name,
    doctor_designation: raw.doctor.specialization,
    doctor_room: raw.doctor.room || 'Reception',
    department_name: raw.department.name,
    department_slug: raw.department.slug,
    appointment_date: raw.appointment_date,
    start_time: raw.slot_time,
    end_time: addMinutes(raw.slot_time, raw.duration_minutes),
    status: raw.status,
    queue_number: raw.queue_number,
    reason: raw.reason,
    doctor_notes: raw.doctor_notes,
    cancelled_reason: null,
    created_at: raw.created_at || '',
    updated_at: raw.created_at || '',
  }
}

function adaptQueueFields(raw: RawPublicQueue): PublicQueue {
  const activeStatuses = ['booked', 'checked_in', 'in_progress']
  const total = raw.total_in_queue
  const waiting = raw.patients_ahead
  return {
    appointment: {
      reference: raw.reference_code,
      doctor_name: raw.doctor_name,
      doctor_designation: raw.doctor_specialization || 'Consultant',
      department_name: raw.department_name,
      room_number: raw.doctor_room || 'Reception',
      appointment_date: raw.appointment_date,
      start_time: raw.slot_time,
      end_time: addMinutes(raw.slot_time, raw.avg_consult_minutes || 15),
      status: raw.status,
      queue_number: raw.queue_number,
      checked_in_at: ['checked_in', 'in_progress', 'completed'].includes(raw.status)
        ? new Date().toISOString()
        : null,
      called_at: ['in_progress', 'completed'].includes(raw.status) ? new Date().toISOString() : null,
      completed_at: raw.status === 'completed' ? new Date().toISOString() : null,
      estimated_wait_minutes: raw.estimated_wait_minutes,
      people_ahead: raw.patients_ahead,
    },
    doctor: {
      name: raw.doctor_name,
      designation: raw.doctor_specialization || 'Consultant',
      department: raw.department_name,
      room_number: raw.doctor_room || 'Reception',
      avg_consult_minutes: raw.avg_consult_minutes || 15,
    },
    queue: {
      date: raw.appointment_date,
      current_number: raw.current_serving,
      served: Math.max(0, total - waiting - 1),
      waiting,
      total,
      progress: raw.progress_percent,
      is_active: raw.appointment_date === todayISO() && activeStatuses.includes(raw.status),
    },
    people_ahead: raw.patients_ahead,
    estimated_wait_minutes: raw.estimated_wait_minutes,
    your_position: raw.patients_ahead + 1,
    is_today: raw.appointment_date === todayISO(),
  }
}

export function adaptPublicQueue(raw: RawPublicQueue): PublicQueue {
  return adaptQueueFields(raw)
}

export function adaptQueueStatus(raw: RawQueueStatus): PublicQueue {
  return adaptQueueFields({
    reference_code: raw.reference_code,
    appointment_date: raw.appointment_date,
    slot_time: raw.slot_time,
    status: raw.status,
    queue_number: raw.queue_number,
    doctor_name: raw.doctor_name,
    doctor_specialization: raw.doctor_specialization,
    doctor_room: raw.doctor_room,
    department_name: raw.department_name,
    current_serving: raw.current_serving,
    patients_ahead: raw.patients_ahead,
    total_in_queue: raw.total_in_queue,
    estimated_wait_minutes: raw.estimated_wait_minutes,
    avg_consult_minutes: raw.avg_consult_minutes,
    progress_percent: raw.progress_percent,
  })
}

export function adaptNotification(raw: RawNotification): Notification {
  return {
    id: raw.id,
    title: raw.title,
    message: raw.message,
    type: raw.category,
    is_read: raw.is_read,
    link: raw.link,
    created_at: raw.created_at || '',
  }
}

export function adaptPatientDashboard(raw: RawPatientDashboard): PatientDashboard {
  const recent = raw.recent_appointments.map(adaptAppointment)
  const next = raw.next_appointment ? adaptAppointment(raw.next_appointment) : null
  const today = todayISO()
  const todayAppointment =
    (next?.appointment_date === today ? next : null) ||
    recent.find(
      (item) =>
        item.appointment_date === today &&
        ['booked', 'checked_in', 'in_progress'].includes(item.status),
    ) ||
    null
  const queue = raw.active_queue ? adaptQueueStatus(raw.active_queue) : null
  return {
    stats: { ...raw.stats, today: todayAppointment ? 1 : 0 },
    next_appointment: next,
    today_appointment: todayAppointment,
    recent,
    queue,
    notifications: raw.notifications.map(adaptNotification),
  }
}

export function adaptDoctorDashboard(raw: RawDoctorDashboard): DoctorDashboard {
  return {
    today: raw.today,
    stats: {
      today_total: raw.stats.today_total ?? raw.stats.today ?? 0,
      waiting: raw.stats.waiting ?? 0,
      checked_in: raw.stats.checked_in ?? 0,
      in_progress: raw.stats.in_progress ?? 0,
      completed: raw.stats.completed ?? 0,
      no_show: raw.stats.no_show ?? 0,
    },
    current: raw.current ? adaptAppointment(raw.current) : null,
    next: raw.next ? adaptAppointment(raw.next) : null,
    waiting: raw.waiting.map(adaptAppointment),
    completed: raw.completed.map(adaptAppointment),
    upcoming: raw.upcoming.map(adaptAppointment),
    weekly: raw.weekly,
    doctor: raw.doctor,
  }
}

export function adaptDoctorQueue(raw: RawDoctorQueue): DoctorQueue {
  return {
    date: raw.date,
    current: raw.current ? adaptAppointment(raw.current) : null,
    next: raw.next ? adaptAppointment(raw.next) : null,
    waiting: raw.waiting.map(adaptAppointment),
    completed: raw.completed.map(adaptAppointment),
    stats: raw.stats,
    avg_consult_minutes: raw.avg_consult_minutes,
    last_updated: raw.last_updated,
  }
}

export function adaptQueueOverview(raw: RawQueueOverview): QueueOverview {
  return {
    date: raw.date,
    items: raw.items.map((item) => ({
      doctor: item.doctor,
      stats: item.stats,
      current: item.current ? adaptAppointment(item.current) : null,
    })),
  }
}

export function adaptActivity(raw: RawActivity): Activity {
  return {
    id: raw.id,
    actor_id: null,
    actor_name: raw.actor_name,
    action: raw.action,
    entity_type: raw.entity_type,
    entity_id: raw.entity_id,
    description: raw.detail || raw.action.replaceAll('.', ' '),
    created_at: raw.created_at || '',
  }
}

export function adaptAdminStats(raw: RawAdminStats): AdminStats {
  return { ...raw, recent_activity: raw.recent_activity.map(adaptActivity) }
}

export function adaptPatientSummary(raw: RawAdminUser): PatientSummary {
  return {
    id: raw.id,
    full_name: raw.full_name,
    email: raw.email,
    phone: raw.phone,
    date_of_birth: raw.date_of_birth,
    gender: raw.gender,
    address: null,
    is_active: raw.is_active,
    created_at: raw.created_at || '',
    appointment_count: raw.appointment_count,
    last_visit: null,
  }
}

export function adaptSchedule(raw: RawSchedule, doctor?: Doctor): Schedule {
  return {
    doctor: doctor ?? (raw.doctor ? adaptDoctor(raw.doctor) : undefined),
    availability: (raw.availability || []).map(adaptAvailability),
    time_off: (raw.time_off || []).map(adaptTimeOff),
  }
}

export function adaptContactMessage(raw: RawContactMessage): ContactMessage {
  return { ...raw, created_at: raw.created_at || '' }
}

export function adaptUser(raw: User): User {
  return {
    ...raw,
    phone: raw.phone ?? null,
    date_of_birth: raw.date_of_birth ?? null,
    gender: raw.gender ?? null,
    address: raw.address ?? null,
    created_at: raw.created_at || '',
  }
}

export function adaptPage<T, U>(raw: { items: T[]; total: number; page: number; page_size: number; pages: number }, map: (item: T) => U) {
  return {
    items: raw.items.map(map),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    pages: raw.pages,
  }
} 
