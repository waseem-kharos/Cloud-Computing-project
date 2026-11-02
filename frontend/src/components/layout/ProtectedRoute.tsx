import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@/api/types'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/context/AuthContext'
import { dashboardPath } from '@/lib/utils'

export function FullPageLoader({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <Logo />
      <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
        <Loader2 className="size-4 animate-spin text-brand-500" /> {label}
      </div>
    </div>
  )
}

export function ProtectedRoute({ children, roles }: { children?: ReactNode; roles: Role[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={dashboardPath[user.role]} replace />
  }
  return <>{children ?? <Outlet />}</>
}
