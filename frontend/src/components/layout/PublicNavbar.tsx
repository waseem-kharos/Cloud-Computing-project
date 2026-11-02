import { CalendarPlus, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/cn'
import { NAV_LINKS } from '@/lib/constants'

export function PublicNavbar() {
  const { user, logout, homePath } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  async function handleLogout() {
    await logout()
    toast({ title: 'Signed out', description: 'You have been securely signed out.' })
    navigate('/')
  }

  return (
    <header className="panel-glass sticky top-0 z-40 border-b border-line/80 shadow-[0_8px_24px_-22px_rgb(16_43_80_/_0.6)]">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="MediQueue home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-[13px] font-semibold transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/track-queue" className="px-2 text-[13px] font-semibold text-ink-500 transition hover:text-brand-700">
            Track queue
          </Link>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <Avatar name={user.full_name} size="sm" />
                <span className="max-w-28 truncate text-xs font-semibold text-ink-700">{user.full_name}</span>
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-56 animate-scale-in rounded-xl border border-line bg-white p-1.5 shadow-lift"
                >
                  <div className="border-b border-line px-2.5 py-2">
                    <p className="truncate text-xs font-semibold text-ink-900">{user.full_name}</p>
                    <p className="truncate text-[11px] text-ink-400">{user.email}</p>
                  </div>
                  <Link
                    to={homePath}
                    role="menuitem"
                    className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink-600 hover:bg-ink-50"
                  >
                    <LayoutDashboard className="size-3.5" /> Dashboard
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="size-3.5" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                Login
              </Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>
                <CalendarPlus aria-hidden className="size-3.5" /> Book appointment
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex size-10 items-center justify-center rounded-xl border border-line bg-white text-ink-600 lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-white px-4 pb-8 pt-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-4 py-3 text-sm font-semibold',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/track-queue"
              className={({ isActive }) =>
                cn('rounded-xl px-4 py-3 text-sm font-semibold', isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50')
              }
            >
              Track queue
            </NavLink>
          </nav>
          <div className="mt-5 border-t border-line pt-5">
            {user ? (
              <div className="space-y-2">
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                  <Avatar name={user.full_name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{user.full_name}</p>
                    <p className="truncate text-xs text-ink-400">{user.email}</p>
                  </div>
                </div>
                <Link to={homePath} className={buttonClasses('primary', 'md', 'w-full')}>
                  Go to dashboard
                </Link>
                <Button variant="outline" className="w-full" onClick={() => void handleLogout()}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                <Link to="/register" className={buttonClasses('primary', 'md', 'w-full')}>
                  Book appointment
                </Link>
                <Link to="/login" className={buttonClasses('outline', 'md', 'w-full')}>
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
