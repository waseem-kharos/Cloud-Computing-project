import type {
  Activity,
  AdminStats,
  Appointment,
  AppointmentStatus,
  AvailabilityBlock,
  CallNextResult,
  ContactMessage,
  Department,
  Doctor,
  DoctorDashboard,
  DoctorProfile,
  DoctorQueue,
  LoginResponse,
  Message,
  Notification,
  Paged,
  PatientDashboard,
  PatientSummary,
  PublicQueue,
  QueueOverview,
  Schedule,
  Slot,
  User,
} from './types'
import type {
  RawAdminDoctor,
  RawAdminStats,
  RawAdminUser,
  RawAppointment,
  RawCallNext,
  RawContactMessage,
  RawDepartment,
  RawDoctorDashboard,
  RawDoctorQueue,
  RawMessage,
  RawNotificationList,
  RawPage,
  RawPatientDashboard,
  RawPublicDoctor,
  RawPublicQueue,
  RawQueueOverview,
  RawQueueStatus,
  RawSchedule,
  RawSlot,
  RawTimeOff,
  RawActivity,
} from './raw'
import {
  adaptActivity,
  adaptAdminStats,
  adaptAppointment,
  adaptContactMessage,
  adaptDepartment,
  adaptDoctor,
  adaptDoctorDashboard,
  adaptDoctorProfile,
  adaptDoctorQueue,
  adaptNotification,
  adaptPage,
  adaptPatientDashboard,
  adaptPatientSummary,
  adaptPublicQueue,
  adaptQueueOverview,
  adaptQueueStatus,
  adaptSchedule,
  adaptSlot,
  adaptUser,
  todayISO,
} from './adapters'
import { api } from './client'

function doctorPayload(payload: Record<string, unknown>) {
  const next = { ...payload }
  if ('designation' in next) {
    next.specialization = next.designation
    delete next.designation
  }
  if ('room_number' in next) {
    next.room = next.room_number
    delete next.room_number
  }
  delete next.languages
  delete next.email_verified
  if (next.password === '') delete next.password
  return next
}

function departmentPayload(payload: Record<string, unknown>) {
  const next = { ...payload }
  delete next.location
  delete next.phone
  return next
}

function patientPayload(payload: Record<string, unknown>) {
  const next = { ...payload }
  delete next.date_of_birth
  delete next.gender
  delete next.address
  return next
}

function schedulePayload(
  blocks: (AvailabilityBlock | {
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
    slot_minutes?: number
  })[],
) {
  return {
    availability: blocks.map((block) => ({
      weekday: block.day_of_week,
      start_time: block.start_time,
      end_time: block.end_time,
      slot_minutes: block.slot_minutes ?? 15,
      is_active: block.is_active,
    })),
  }
}

export const authApi = {
  me: () => api.get<User>('/auth/me').then((r) => adaptUser(r.data)),
  login: (payload: { email: string; password: string }) =>
    api
      .post<LoginResponse>('/auth/login', payload)
      .then((r) => ({ ...r.data, user: adaptUser(r.data.user) })),
  register: (payload: {
    full_name: string
    email: string
    phone: string
    password: string
    date_of_birth?: string | null
    gender?: string | null
  }) =>
    api
      .post<LoginResponse>('/auth/register', payload)
      .then((r) => ({ ...r.data, user: adaptUser(r.data.user) })),
  logout: () => api.post<Message>('/auth/logout'),
  updateMe: (
    payload: Partial<Pick<User, 'full_name' | 'phone' | 'date_of_birth' | 'gender' | 'address'>>,
  ) => api.patch<User>('/auth/me', payload).then((r) => adaptUser(r.data)),
  changePassword: (payload: { current_password: string; new_password: string }) =>
    api.post<Message>('/auth/change-password', payload),
}

export const publicApi = {
  departments: () =>
    api.get<RawDepartment[]>('/public/departments').then((r) => r.data.map(adaptDepartment)),
  doctors: (params?: {
    search?: string
    department_id?: number
    page?: number
    page_size?: number
    sort?: string
  }) =>
    api
      .get<RawPage<RawPublicDoctor>>('/public/doctors', {
        params: {
          q: params?.search || undefined,
          department_id: params?.department_id,
          sort:
            params?.sort === 'fee_low' || params?.sort === 'fee_high' ? 'fee' : params?.sort,
          page: params?.page,
          page_size: params?.page_size,
        },
      })
      .then((r) => adaptPage(r.data, adaptDoctor)),
  doctor: (id: number) =>
    api.get<RawPublicDoctor>(`/public/doctors/${id}`).then((r) => adaptDoctor(r.data)),
  slots: (doctorId: number, day: string) =>
    api
      .get<RawSlot[]>(`/public/doctors/${doctorId}/slots`, { params: { date: day } })
      .then((r) => r.data.map(adaptSlot)),
  queue: (reference: string) =>
    api
      .get<RawPublicQueue>(`/public/queue/${encodeURIComponent(reference.trim().toUpperCase())}`)
      .then((r) => adaptPublicQueue(r.data)),
  contact: (payload: { name: string; email: string; subject: string; message: string }) =>
    api.post<Message>('/public/contact', payload).then((r) => r.data),
}

export const patientApi = {
  dashboard: () =>
    api.get<RawPatientDashboard>('/patient/dashboard').then((r) => adaptPatientDashboard(r.data)),
  appointments: (params?: {
    scope?: 'all' | 'upcoming' | 'past'
    status?: string
    page?: number
    page_size?: number
  }) =>
    api
      .get<RawPage<RawAppointment>>('/patient/appointments', { params })
      .then((r) => adaptPage(r.data, adaptAppointment)),
  appointment: (id: number) =>
    api.get<RawAppointment>(`/patient/appointments/${id}`).then((r) => adaptAppointment(r.data)),
  book: (payload: {
    doctor_id: number
    appointment_date: string
    start_time: string
    reason?: string
  }) =>
    api
      .post<RawAppointment>('/patient/appointments', {
        doctor_id: payload.doctor_id,
        appointment_date: payload.appointment_date,
        slot_time: payload.start_time,
        reason: payload.reason || null,
      })
      .then((r) => adaptAppointment(r.data)),
  reschedule: (id: number, payload: { appointment_date: string; start_time: string }) =>
    api
      .patch<RawAppointment>(`/patient/appointments/${id}/reschedule`, {
        appointment_date: payload.appointment_date,
        slot_time: payload.start_time,
      })
      .then((r) => adaptAppointment(r.data)),
  cancel: (id: number) =>
    api.post<Message>(`/patient/appointments/${id}/cancel`).then((r) => r.data),
  queue: (appointmentId?: number) => {
    if (appointmentId) {
      return Promise.all([
        api.get<RawAppointment>(`/patient/appointments/${appointmentId}`),
        api.get<RawQueueStatus>(`/patient/appointments/${appointmentId}/queue`),
      ]).then(([appointment, queue]) => ({
        appointment: adaptAppointment(appointment.data),
        queue: adaptQueueStatus(queue.data),
        is_today: appointment.data.appointment_date === todayISO(),
      }))
    }
    return api
      .get<{
        appointment: RawAppointment | null
        queue: RawQueueStatus | null
        is_today: boolean
      }>('/patient/queue')
      .then((r) => ({
        appointment: r.data.appointment ? adaptAppointment(r.data.appointment) : null,
        queue: r.data.queue ? adaptQueueStatus(r.data.queue) : null,
        is_today: r.data.is_today,
      }))
  },
  profile: () => authApi.me(),
}

export const doctorApi = {
  dashboard: () =>
    api.get<RawDoctorDashboard>('/doctor/dashboard').then((r) => adaptDoctorDashboard(r.data)),
  appointments: (params?: {
    status?: string
    day?: string
    search?: string
    page?: number
    page_size?: number
  }) =>
    api
      .get<RawPage<RawAppointment>>('/doctor/appointments', {
        params: { ...params, q: params?.search, search: undefined },
      })
      .then((r) => adaptPage(r.data, adaptAppointment)),
  appointment: (id: number) =>
    api.get<RawAppointment>(`/doctor/appointments/${id}`).then((r) => adaptAppointment(r.data)),
  updateStatus: (id: number, payload: { status: AppointmentStatus; doctor_notes?: string | null }) =>
    api
      .patch<RawAppointment>(`/doctor/appointments/${id}/status`, payload)
      .then((r) => adaptAppointment(r.data)),
  queue: (day?: string) =>
    api
      .get<RawDoctorQueue>('/doctor/queue', { params: { day } })
      .then((r) => adaptDoctorQueue(r.data)),
  callNext: (day?: string) =>
    api
      .post<RawCallNext>('/doctor/queue/call-next', null, { params: { day } })
      .then((r) => ({
        message: r.data.message,
        appointment: r.data.appointment ? adaptAppointment(r.data.appointment) : null,
      }) as CallNextResult),
  schedule: () =>
    api.get<RawSchedule>('/doctor/schedule').then((r) => adaptSchedule(r.data)),
  updateSchedule: (
    blocks:
      | AvailabilityBlock[]
      | { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[],
  ) =>
    api
      .put<{ message: string; availability: RawSchedule['availability'] }>(
        '/doctor/schedule',
        schedulePayload(blocks),
      )
      .then((r) => adaptSchedule({ availability: r.data.availability, time_off: [] })),
  addTimeOff: (payload: { off_date: string; reason?: string }) =>
    api.post<RawTimeOff>('/doctor/time-off', payload).then((r) => r.data),
  removeTimeOff: (id: number) => api.delete<Message>(`/doctor/time-off/${id}`),
  profile: () =>
    api
      .get<RawAdminDoctor>('/doctor/profile')
      .then((r) => adaptDoctorProfile(r.data)),
  updateProfile: (payload: Record<string, unknown>) =>
    api
      .patch<RawAdminDoctor>('/doctor/profile', doctorPayload(payload))
      .then((r) => adaptDoctorProfile(r.data)),
}

export const adminApi = {
  stats: () => api.get<RawAdminStats>('/admin/stats').then((r) => adaptAdminStats(r.data)),
  patients: (params?: {
    search?: string
    status?: 'all' | 'active' | 'inactive'
    page?: number
    page_size?: number
  }) =>
    api
      .get<RawPage<RawAdminUser>>('/admin/patients', {
        params: { ...params, q: params?.search, search: undefined },
      })
      .then((r) => adaptPage(r.data, adaptPatientSummary)),
  updatePatient: (id: number, payload: Record<string, unknown>) =>
    api
      .patch<RawAdminUser>(`/admin/patients/${id}`, patientPayload(payload))
      .then((r) => adaptPatientSummary(r.data)),
  deactivatePatient: (id: number) =>
    api
      .patch<RawAdminUser>(`/admin/patients/${id}`, { is_active: false })
      .then((r) => adaptPatientSummary(r.data)),
  doctors: (params?: {
    search?: string
    department_id?: number
    status?: 'all' | 'active' | 'inactive'
    page?: number
    page_size?: number
  }) =>
    api
      .get<RawPage<RawAdminDoctor>>('/admin/doctors', {
        params: { ...params, q: params?.search, search: undefined },
      })
      .then((r) => adaptPage(r.data, adaptDoctor)),
  createDoctor: (payload: Record<string, unknown>) =>
    api
      .post<RawAdminDoctor>('/admin/doctors', doctorPayload(payload))
      .then((r) => adaptDoctor(r.data)),
  updateDoctor: (id: number, payload: Record<string, unknown>) =>
    api
      .patch<RawAdminDoctor>(`/admin/doctors/${id}`, doctorPayload(payload))
      .then((r) => adaptDoctor(r.data)),
  departments: () =>
    api
      .get<RawDepartment[]>('/admin/departments', { params: { include_inactive: true } })
      .then((r) => r.data.map(adaptDepartment)),
  createDepartment: (payload: Record<string, unknown>) =>
    api
      .post<RawDepartment>('/admin/departments', departmentPayload(payload))
      .then((r) => adaptDepartment(r.data)),
  updateDepartment: (id: number, payload: Record<string, unknown>) =>
    api
      .patch<RawDepartment>(`/admin/departments/${id}`, departmentPayload(payload))
      .then((r) => adaptDepartment(r.data)),
  deleteDepartment: (id: number) => api.delete<Message>(`/admin/departments/${id}`),
  appointments: (params?: {
    search?: string
    status?: string
    day?: string
    doctor_id?: number
    page?: number
    page_size?: number
  }) =>
    api
      .get<RawPage<RawAppointment>>('/admin/appointments', {
        params: { ...params, q: params?.search, search: undefined },
      })
      .then((r) => adaptPage(r.data, adaptAppointment)),
  updateAppointmentStatus: (
    id: number,
    payload: { status: AppointmentStatus; doctor_notes?: string | null },
  ) =>
    api
      .patch<RawAppointment>(`/admin/appointments/${id}/status`, payload)
      .then((r) => adaptAppointment(r.data)),
  cancelAppointment: (id: number, reason?: string) =>
    api
      .post<Message>(`/admin/appointments/${id}/cancel`, { reason: reason || null })
      .then((r) => r.data),
  queues: (day?: string) =>
    api
      .get<RawQueueOverview>('/admin/queues', { params: { day } })
      .then((r) => adaptQueueOverview(r.data)),
  queue: (doctorId: number, day?: string) =>
    api
      .get<RawDoctorQueue>('/admin/queues', { params: { doctor_id: doctorId, day } })
      .then((r) => adaptDoctorQueue(r.data)),
  callNext: (doctorId: number, day?: string) =>
    api
      .post<RawCallNext>(`/admin/queues/${doctorId}/call-next`, null, { params: { day } })
      .then((r) => ({
        message: r.data.message,
        appointment: r.data.appointment ? adaptAppointment(r.data.appointment) : null,
      }) as CallNextResult),
  schedule: (doctorId: number) =>
    api
      .get<RawSchedule>(`/admin/doctors/${doctorId}/schedule`)
      .then((r) => adaptSchedule(r.data)),
  updateSchedule: (
    doctorId: number,
    blocks:
      | AvailabilityBlock[]
      | { day_of_week: number; start_time: string; end_time: string; is_active: boolean }[],
  ) =>
    api
      .put<{ message: string; availability: RawSchedule['availability'] }>(
        `/admin/doctors/${doctorId}/schedule`,
        schedulePayload(blocks),
      )
      .then((r) => adaptSchedule({ availability: r.data.availability, time_off: [] })),
  addTimeOff: (doctorId: number, payload: { off_date: string; reason?: string }) =>
    api.post<RawTimeOff>(`/admin/doctors/${doctorId}/time-off`, payload).then((r) => r.data),
  removeTimeOff: (doctorId: number, id: number) =>
    api.delete<Message>(`/admin/doctors/${doctorId}/time-off/${id}`),
  activity: (params?: { page?: number; page_size?: number }) =>
    api
      .get<RawPage<RawActivity>>('/admin/activity', { params })
      .then((r) => adaptPage(r.data, adaptActivity)),
  messages: (params?: { page?: number; page_size?: number }) =>
    api
      .get<RawPage<RawContactMessage>>('/admin/messages', { params })
      .then((r) => adaptPage(r.data, adaptContactMessage)),
  handleMessage: (id: number) => api.post<Message>(`/admin/messages/${id}/handled`),
}

export const notificationApi = {
  list: () =>
    api
      .get<RawNotificationList>('/notifications')
      .then((r) => r.data.items.map(adaptNotification) as Notification[]),
  markRead: (id: number) => api.post<Message>(`/notifications/${id}/read`),
  markAllRead: () => api.post<Message>('/notifications/read-all'),
}

export type { ContactMessage, DoctorProfile, DoctorQueue, Paged, QueueOverview, Schedule, Slot }
