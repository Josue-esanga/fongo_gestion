import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingScreen } from '@/components/Feedback'
import { useAuth } from '@/contexts/AuthContext'
import type { Role } from '@/types'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingScreen label="Vérification de votre session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: ReactNode
}) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
