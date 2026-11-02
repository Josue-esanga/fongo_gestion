import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Icon } from '@/components/Icon'
import { UserAvatar } from '@/components/UserAvatar'
import { NAV_ITEMS } from '@/components/layout/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { rolesLabel } from '@/lib/format'
import { prefetchRoute } from '@/lib/routePrefetch'

export function Topbar({
  collapsed,
  onToggleCollapsed,
  onOpenMobile,
  onLogout,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  onOpenMobile: () => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const roleText = useMemo(
    () => rolesLabel(user?.role, user?.roles_supplementaires),
    [user?.role, user?.roles_supplementaires],
  )

  const pageTitle = useMemo(() => {
    const item = NAV_ITEMS.find((entry) =>
      location.pathname.startsWith(entry.to),
    )
    return item?.label ?? 'FongoGestion'
  }, [location.pathname])

  useEffect(() => {
    if (!profileMenuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setProfileMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen])

  function goTo(to: string) {
    setProfileMenuOpen(false)
    navigate(to)
  }

  function handleLogout() {
    setProfileMenuOpen(false)
    onLogout()
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button"
          
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 md:hidden"
          onClick={onOpenMobile}
          aria-label="Ouvrir le menu"
        >
          <Icon className="pi pi-bars text-lg" />
        </button>
        <Logo />
      </div>

      <div className="hidden flex-1 text-center md:block">
        <h1 className="text-base font-semibold text-white">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button type="button"
          
          className="hidden h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 md:flex"
          onClick={onToggleCollapsed}
          aria-label="Réduire le menu latéral"
        >
          <Icon className={`pi ${collapsed ? 'pi-angle-right' : 'pi-angle-left'}`} />
        </button>

        <div ref={profileMenuRef} className="relative">
          <button type="button"
            
            onClick={() => setProfileMenuOpen((value) => !value)}
            className="flex items-center gap-2 rounded-full p-0.5 text-left transition hover:ring-4 hover:ring-white/10"
            aria-label="Menu utilisateur"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            aria-controls="profile-menu"
          >
            <div className="hidden flex-col text-right sm:flex">
              <span className="text-sm font-bold text-white">
                {user?.full_name || user?.username}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-blue-200">
                {roleText}
              </span>
            </div>
            <UserAvatar user={user} size="md" />
            <i
              className={`pi pi-chevron-down mr-1 hidden text-[10px] text-blue-200 transition-transform sm:block ${
                profileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {profileMenuOpen && (
            <div
              id="profile-menu"
              role="menu"
              className="absolute right-0 top-full z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25 animate-fade-in-up"
            >
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user?.full_name || user?.username}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  @{user?.username} · {roleText}
                </p>
              </div>

              <div className="p-2">
                <button type="button"
                  
                  role="menuitem"
                  onClick={() => goTo('/parametres')}
                  onMouseEnter={() => prefetchRoute('/parametres')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <Icon className="pi pi-user text-slate-400" />
                  Mon profil
                </button>
                <button type="button"
                  
                  role="menuitem"
                  onClick={() => goTo('/parametres?tab=securite')}
                  onMouseEnter={() => prefetchRoute('/parametres')}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <Icon className="pi pi-lock text-slate-400" />
                  Sécurité
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button type="button"
                  
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Icon className="pi pi-sign-out" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
