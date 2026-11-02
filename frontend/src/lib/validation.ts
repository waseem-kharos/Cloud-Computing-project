import { z } from 'zod'

const phone = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(20, 'Phone number is too long')
  .regex(/^[+0-9()\-\s]+$/, 'Use digits, spaces, brackets, + or -')

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name').max(120, 'Name is too long'),
    email: z.string().trim().email('Enter a valid email address'),
    phone,
    date_of_birth: z.string().optional(),
    gender: z.string().optional(),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm_password: z.string(),
    accept_terms: z.boolean().refine((value) => value, { message: 'Please accept the terms to continue' }),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  subject: z.string().trim().min(3, 'Add a short subject').max(160),
  message: z.string().trim().min(10, 'Tell us a little more').max(3000),
})

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name').max(120),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
})

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password'),
    new_password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm_password: z.string(),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

export const doctorProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name').max(120),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  designation: z.string().trim().min(2, 'Enter your designation').max(120),
  qualifications: z.string().trim().min(2, 'Enter your qualifications').max(240),
  bio: z.string().trim().max(1200).optional().or(z.literal('')),
  room_number: z.string().trim().min(1, 'Enter a room number').max(20),
  consultation_fee: z.coerce.number().min(0, 'Fee cannot be negative').max(1000000),
  avg_consult_minutes: z.coerce.number().min(5, 'At least 5 minutes').max(120),
  experience_years: z.coerce.number().min(0).max(70),
  languages: z.string().trim().max(200).optional().or(z.literal('')),
})

export const reasonSchema = z.object({
  reason: z.string().trim().max(500, 'Keep your reason under 500 characters').optional().or(z.literal('')),
})

export const timeOffSchema = z.object({
  off_date: z.string().min(1, 'Choose a date'),
  reason: z.string().trim().max(255).optional().or(z.literal('')),
})

export const departmentSchema = z.object({
  name: z.string().trim().min(2, 'Enter a department name').max(120),
  description: z.string().trim().min(10, 'Add a short description').max(800),
  icon: z.string().trim().min(1, 'Choose an icon'),
  location: z.string().trim().min(2, 'Enter a location').max(160),
  phone: z.string().trim().min(7, 'Enter a contact number').max(30),
  is_active: z.boolean(),
})

export const doctorAdminSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter the doctor’s name').max(120),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  department_id: z.coerce.number().min(1, 'Choose a department'),
  designation: z.string().trim().min(2, 'Enter a designation').max(120),
  qualifications: z.string().trim().min(2, 'Enter qualifications').max(240),
  bio: z.string().trim().max(1200).optional().or(z.literal('')),
  consultation_fee: z.coerce.number().min(0).max(1000000),
  avg_consult_minutes: z.coerce.number().min(5).max(120),
  experience_years: z.coerce.number().min(0).max(70),
  room_number: z.string().trim().min(1, 'Enter a room number').max(20),
  languages: z.string().trim().max(200).optional().or(z.literal('')),
  is_active: z.boolean(),
})

export const patientAdminSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter the patient’s name').max(120),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  is_active: z.boolean(),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ContactValues = z.infer<typeof contactSchema>
export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordValues = z.infer<typeof passwordSchema>
export type DoctorProfileValues = z.infer<typeof doctorProfileSchema>
export type TimeOffValues = z.infer<typeof timeOffSchema>
export type DepartmentValues = z.infer<typeof departmentSchema>
export type DoctorAdminValues = z.infer<typeof doctorAdminSchema>
export type PatientAdminValues = z.infer<typeof patientAdminSchema>
