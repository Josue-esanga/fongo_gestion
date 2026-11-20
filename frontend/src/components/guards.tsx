import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingScreen } from '@/components/Feedback'
import { useAuth, type Capability } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
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

/**
 * Section ouverte à un autre profil : on signale simplement que la page est
 * indisponible, puis on renvoie vers le tableau de bord. Aucun détail sur les
 * rôles n'est affiché.
 */
function PageUnavailableRedirect() {
  const { showToast } = useToast()
  // StrictMode exécute deux fois l'effet : on n'affiche le bandeau qu'une fois.
  const announced = useRef(false)

  useEffect(() => {
    if (announced.current) return
    announced.current = true
    showToast(
      'warn',
      'Page indisponible',
      "Cette page n'est pas disponible pour votre compte.",
    )
  }, [showToast])

  return <Navigate to="/dashboard" replace />
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
    return <PageUnavailableRedirect />
  }

  return <>{children}</>
}

/**
 * Protège une section selon sa visibilité : membres, planning, formateurs,
 * modules et présences sont masqués aux stagiaires, la finance aux profils
 * non caissiers.
 */
export function RequireSection({
  section,
  children,
}: {
  section: Capability
  children: ReactNode
}) {
  const { canSee } = useAuth()

  if (!canSee(section)) {
    return <PageUnavailableRedirect />
  }

  return <>{children}</>
}
