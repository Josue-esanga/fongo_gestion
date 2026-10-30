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

/**
 * Sections du projet que l'on peut gérer (création / modification /
 * suppression) ou simplement consulter.
 *
 * - `can(section)` → droit de CRUD : super admin partout, un admin seulement
 *   pour les sections couvertes par ses rôles supplémentaires (la gestion des
 *   présences est ouverte à tous les utilisateurs hors stagiaires, seule sa
 *   suppression reste réservée au super admin) ;
 * - `canSee(section)` → visibilité de l'entrée de menu : tout sauf les
 *   stagiaires pour l'annuaire, le planning, les formateurs, les modules et
 *   les présences ; la finance reste réservée aux caissiers, aux stagiaires et
 *   au super admin.
 */
export type Capability =
  | 'membres'
  | 'planning'
  | 'annonces'
  | 'formateurs'
  | 'modules'
  | 'presences'
  | 'parametres'
  | 'devoirs'
  | 'finance'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isStagiaire: boolean
  isSuperAdmin: boolean
  /** Droit de CRUD sur une section donnée. */
  can: (capability: Capability) => boolean
  /** Droit de consulter une section (menu et route). */
  canSee: (capability: Capability) => boolean
  /** L'option Finance est visible (stagiaire, caissier ou super admin). */
  canSeeFinance: boolean
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

  const value = useMemo<AuthContextValue>(() => {
    const isSuperAdmin = Boolean(
      user && (user.role === 'super_admin' || user.is_superuser),
    )
    const isAdmin = Boolean(
      user && (user.role === 'admin' || user.role === 'super_admin'),
    )
    const isStagiaire = Boolean(user && user.role === 'stagiaire')
    const extras = user?.roles_supplementaires ?? []

    function can(capability: Capability): boolean {
      if (!user) return false
      if (isSuperAdmin) return true
      // Un simple stagiaire ne gère aucune section.
      if (user.role !== 'admin') return false
      // La gestion des présences (démarrage / clôture d'un appel) est
      // opérationnelle : ouverte à tous les utilisateurs hors stagiaires.
      if (capability === 'presences') return true
      // Un admin ne gère que les sections couvertes par ses rôles
      // supplémentaires (formateur → devoirs, caissier → finance).
      if (capability === 'devoirs') return extras.includes('formateur')
      if (capability === 'finance') return extras.includes('caissier')
      return false
    }

    function canSee(capability: Capability): boolean {
      if (!user) return false
      switch (capability) {
        // Annuaire, planning, formateurs, modules et présences : tous les
        // utilisateurs hors stagiaires (lecture seule pour les admins sans
        // rôle supplémentaire, sauf gestion des présences).
        case 'membres':
        case 'planning':
        case 'formateurs':
        case 'modules':
        case 'presences':
          return !isStagiaire
        // Finance : caissiers, super admin et les propres versements du
        // stagiaire.
        case 'finance':
          return isStagiaire || can('finance')
        // Lecture ouverte à tous les utilisateurs connectés.
        case 'devoirs':
        case 'annonces':
        case 'parametres':
          return true
        default:
          return false
      }
    }

    return {
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin,
      isStagiaire,
      isSuperAdmin,
      can,
      canSee,
      canSeeFinance: canSee('finance'),
      login,
      logout,
      refreshUser,
      setUser,
    }
  }, [user, loading, login, logout, refreshUser, setUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans <AuthProvider />')
  }
  return context
}
