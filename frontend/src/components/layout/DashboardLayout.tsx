import {
  Activity,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Clock3,
  Contact,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings2,
  Stethoscope,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { Role } from '@/api/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Logo } from '@/components/ui/Logo'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/cn'
import { roleLabels } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navForRole: Record<Role, NavItem[]> = {
  patient: [
    { to: '/patient', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/book', label: 'Book appointment', icon: CalendarDays },
    { to: '/patient/appointments', label: 'My appointments', icon: ClipboardList },
    { to: '/patient/queue', label: 'Live queue', icon: Clock3 },
    { to: '/notifications', label: 'Notifications', icon: MessageSquare },
    { to: '/patient/profile', label: 'Profile', icon: UserRound },
  ],
  doctor: [
    { to: '/doctor', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/doctor/queue', label: "Today's queue", icon: Clock3 },
    { to: '/doctor/appointments', label: 'Appointments', icon: CalendarRange },
    { to: '/doctor/schedule', label: 'My schedule', icon: CalendarDays },
    { to: '/doctor/profile', label: 'Professional profile', icon: Stethoscope },
    { to: '/notifications', label: 'Notifications', icon: MessageSquare },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarRange },
    { to: '/admin/queues', label: 'Queues', icon: Clock3 },
    { to: '/admin/patients', label: 'Patients', icon: Users },
    { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/admin/departments', label: 'Departments', icon: Contact },
    { to: '/admin/schedules', label: 'Schedules', icon: CalendarDays },
    { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { to: '/admin/activity', label: 'Activity log', icon: Activity },
    { to: '/notifications', label: 'Notifications', icon: MessageSquare },
  ],
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!profileOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [profileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  if (!user) return null

  const nav = navForRole[user.role]
  const activeItem =
    [...nav].sort((a, b) => b.to.length - a.to.length).find((item) => location.pathname.startsWith(item.to)) || nav[0]
  const profilePath =
    user.role === 'patient' ? '/patient/profile' : user.role === 'doctor' ? '/doctor/profile' : '/notifications'

  async function handleLogout() {
    await logout()
    toast({ title: 'Signed out', description: 'You have been securely signed out.' })
    navigate('/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <Link to="/" aria-label="MediQueue home">
          <Logo variant="dark" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="flex size-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-50 hover:text-ink-900 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-line bg-white p-3.5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.full_name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink-900">{user.full_name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-500">
                <span className="size-1.5 rounded-full bg-mint-500" />
                {roleLabels[user.role]} workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="scrollbar-thin mt-4 flex-1 overflow-y-auto px-3 pb-4" aria-label="Dashboard navigation">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">Workspace</p>
        <ul className="space-y-1">
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition duration-200',
                    isActive
                      ? 'bg-brand-500 text-white shadow-soft'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                <item.icon aria-hidden className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <Settings2 className="size-4" /> Public website
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="workspace-atmosphere min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-ink-900"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-white shadow-[8px_0_32px_-24px_rgb(16_43_80_/_0.18)] lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="relative h-full w-72 max-w-[85vw] animate-fade-in bg-white shadow-lift">{sidebar}</aside>
        </div>
      ) : null}

      <div className="relative lg:pl-64">
        <header className="panel-glass sticky top-0 z-20 border-b border-line/80">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink-600 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  {roleLabels[user.role]} workspace
                </p>
                <h1 className="truncate text-sm font-bold text-ink-900">{activeItem?.label || 'Dashboard'}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone="mint" dot className="hidden sm:inline-flex">
                Demo environment
              </Badge>
              <NotificationBell />
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white p-1 pr-2 transition hover:border-brand-200 hover:bg-brand-50/40"
                  aria-expanded={profileOpen}
                  aria-label="Open account menu"
                >
                  <Avatar name={user.full_name} size="sm" />
                  <span className="hidden max-w-24 truncate text-xs font-semibold text-ink-700 sm:block">
                    {user.full_name.split(' ')[0]}
                  </span>
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 top-12 w-56 animate-scale-in rounded-xl border border-line bg-white p-1.5 shadow-lift">
                    <div className="border-b border-line px-2.5 py-2">
                      <p className="truncate text-xs font-semibold text-ink-900">{user.full_name}</p>
                      <p className="truncate text-[11px] text-ink-400">{user.email}</p>
                    </div>
                    <Link
                      to={profilePath}
                      className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-600 hover:bg-ink-50"
                    >
                      <UserRound className="size-3.5" /> Account settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="size-3.5" /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="px-4 pb-6 text-center text-[10px] text-ink-400 sm:px-6 lg:px-8">
          MediQueue demo · All clinical data is synthetic · Not for real medical use
        </footer>
      </div>
    </div>
  )
}

export function DashboardMobileCta() {
  return null
}
