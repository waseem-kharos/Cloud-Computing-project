export const aiRiskAlerts = [
  { id: 1, patient: "Ahmed Raza", risk: "High", reason: "Post-op vitals trending up", time: "10 min ago" },
  { id: 2, patient: "Sana Malik", risk: "Medium", reason: "Follow-up overdue", time: "32 min ago" },
  { id: 3, patient: "Bilal Hussain", risk: "Low", reason: "Routine check reminder", time: "1h ago" },
] as const

export const smartReminders = [
  { id: 1, title: "Review lab results", patient: "Fatima Noor", due: "Today 2:00 PM", action: "Review" },
  { id: 2, title: "Prescription refill", patient: "Usman Ali", due: "Today 3:30 PM", action: "Review" },
  { id: 3, title: "Follow-up call", patient: "Hira Shah", due: "Tomorrow 11:00 AM", action: "Review" },
] as const

export const recentPatientNotes = [
  { id: 1, patient: "Zainab Ahmed", note: "Patient reports improved BP control. Continue current regimen.", time: "Yesterday" },
  { id: 2, patient: "Omar Farooq", note: "Mild side effects noted. Monitor for next 48 hours.", time: "2 days ago" },
] as const

export const quickLinks = [
  { label: "Patient Records", icon: "FileText" },
  { label: "Appointments", icon: "CalendarRange" },
  { label: "Prescriptions", icon: "Pill" },
  { label: "Lab Reports", icon: "FlaskConical" },
  { label: "Treatment Plans", icon: "ClipboardList" },
  { label: "Medical History", icon: "BookOpen" },
] as const

export const aiChatQuickReplies = ["Summarize Patient", "Suggest Diagnosis", "Check Drug Interaction"] as const
