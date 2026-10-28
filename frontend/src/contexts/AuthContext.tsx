import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { tokenStorage } from '@/lib/storage'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => tokenStorage.getUser())
  const [loading, setLoading] = useState<boolean>(Boolean(tokenStorage.getAccess()))
  const queryClient = useQueryClient()

  const setUser = useCallback((nextUser: User) => {
    setUserState(nextUser)
    tokenStorage.setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUserState(null)
    queryClient.clear()
  }, [queryClient])

  const refreshUser = useCallback(async () => {
    const current = await authApi.me()
    setUser(current)
  }, [setUser])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!tokenStorage.getAccess()) {
        setLoading(false)
        return
      }
      try {
        const current = await authApi.me()
        if (!cancelled) setUser(current)
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()

    const handleExpired = () => logout()
    window.addEventListener('fongo:session-expired', handleExpired)
    return () => {
      cancelled = true
      window.removeEventListener('fongo:session-expired', handleExpired)
    }
  }, [logout, setUser])

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await authApi.login(username, password)
      tokenStorage.setTokens(data.access, data.refresh)
      setUser(data.user)
      return data.user
    },
    [setUser],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(
        user && (user.role === 'admin' || user.role === 'super_admin'),
      ),
      login,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, login, logout, refreshUser, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans <AuthProvider />')
  }
  return context
}
