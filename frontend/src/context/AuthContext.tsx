import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '@/api/endpoints'
import type { User } from '@/api/types'
import { dashboardPath } from '@/lib/utils'

interface RegisterInput {
  full_name: string
  email: string
  phone: string
  password: string
  date_of_birth?: string
  gender?: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<User | null>
  updateUser: (user: User) => void
  homePath: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const next = await authApi.me()
      setUser(next)
      return next
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('mediqueue:unauthorized', onUnauthorized)
    return () => window.removeEventListener('mediqueue:unauthorized', onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password })
    setUser(result.user)
    return result.user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authApi.register(input)
    setUser(result.user)
    return result.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const updateUser = useCallback((next: User) => setUser(next), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      updateUser,
      homePath: user ? dashboardPath[user.role] : '/',
    }),
    [user, loading, login, register, logout, refresh, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
