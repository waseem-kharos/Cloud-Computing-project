import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { BookingPage } from './pages/patient/BookingPage'
import { PatientAppointmentDetailPage } from './pages/patient/PatientAppointmentDetailPage'
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage'
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage'
import { PatientProfilePage } from './pages/patient/PatientProfilePage'
import { PatientQueuePage } from './pages/patient/PatientQueuePage'
import { AdminActivityPage } from './pages/admin/AdminActivityPage'
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage'
import { AdminDoctorsPage } from './pages/admin/AdminDoctorsPage'
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage'
import { AdminPatientsPage } from './pages/admin/AdminPatientsPage'
import { AdminQueuesPage } from './pages/admin/AdminQueuesPage'
import { AdminSchedulesManagePage } from './pages/admin/AdminSchedulesManagePage'
import { AdminSchedulesPage } from './pages/admin/AdminSchedulesPage'
import { DoctorAppointmentDetailPage } from './pages/doctor/DoctorAppointmentDetailPage'
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage'
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage'
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage'
import { DoctorQueuePage } from './pages/doctor/DoctorQueuePage'
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { ContactPage } from './pages/public/ContactPage'
import { DepartmentsPage } from './pages/public/DepartmentsPage'
import { DoctorDetailPage } from './pages/public/DoctorDetailPage'
import { DoctorsPage } from './pages/public/DoctorsPage'
import { HomePage } from './pages/public/HomePage'
import { HowItWorksPage } from './pages/public/HowItWorksPage'
import { LegalPage } from './pages/public/LegalPage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { TrackQueuePage } from './pages/public/TrackQueuePage'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/track-queue" element={<TrackQueuePage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute roles={['patient', 'doctor', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['patient']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/patient" element={<PatientDashboardPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
            <Route path="/patient/appointments/:id" element={<PatientAppointmentDetailPage />} />
            <Route path="/patient/queue" element={<PatientQueuePage />} />
            <Route path="/patient/profile" element={<PatientProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['doctor']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
            <Route path="/doctor/queue" element={<DoctorQueuePage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetailPage />} />
            <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            <Route path="/doctor/profile" element={<DoctorProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            <Route path="/admin/queues" element={<AdminQueuesPage />} />
            <Route path="/admin/patients" element={<AdminPatientsPage />} />
            <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
            <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
            <Route path="/admin/schedules" element={<AdminSchedulesPage />} />
            <Route path="/admin/doctors/:id/schedule" element={<AdminSchedulesManagePage />} />
            <Route path="/admin/messages" element={<AdminMessagesPage />} />
            <Route path="/admin/activity" element={<AdminActivityPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
