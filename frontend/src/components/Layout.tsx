import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { DefaultPageSkeleton } from '@/components/Skeletons'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth, type Capability } from '@/contexts/AuthContext'
import { rolesLabel } from '@/lib/format'

/** Sous-ensemble du contexte utilisé pour filtrer le menu latéral. */
interface NavAccess {
  canSee: (capability: Capability) => boolean
}

interface NavItem {
  label: string
  to: string
  icon: string
  /** Cache l'entrée lorsque le droit correspondant est absent. */
  visible?: (access: NavAccess) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/dashboard', icon: 'pi pi-home' },
  {
    label: 'Membres',
    to: '/membres',
    icon: 'pi pi-users',
    // Tous les utilisateurs sauf les stagiaires (CRUD super admin).
    visible: ({ canSee }) => canSee('membres'),
  },
  {
    label: 'Finance',
    to: '/finance',
    icon: 'pi pi-wallet',
    // Stagiaires (leurs versements), caissiers et super administrateurs.
    visible: ({ canSee }) => canSee('finance'),
  },
  { label: 'Devoirs', to: '/devoirs', icon: 'pi pi-file-edit' },
  {
    label: 'Planning',
    to: '/planning',
    icon: 'pi pi-calendar',
    visible: ({ canSee }) => canSee('planning'),
  },
  { label: 'Annonces', to: '/annonces', icon: 'pi pi-megaphone' },
  {
    label: 'Formateurs',
    to: '/formateurs',
    icon: 'pi pi-id-card',
    visible: ({ canSee }) => canSee('formateurs'),
  },
  {
    label: 'Modules',
    to: '/modules',
    icon: 'pi pi-book',
    visible: ({ canSee }) => canSee('modules'),
  },
  {
    label: 'Présences',
    to: '/presences',
    icon: 'pi pi-qrcode',
    // Appel par QR code : masqué aux stagiaires (ils scannent depuis leur
    // carte « Ma présence »).
    visible: ({ canSee }) => canSee('presences'),
  },
  { label: 'Paramètres', to: '/parametres', icon: 'pi pi-cog' },
]

function SidebarContent({
  access,
  collapsed = false,
  onNavigate,
  onLogout,
}: {
  access: NavAccess
  collapsed?: boolean
  onNavigate?: () => void
  onLogout: () => void
}) {
  const items = NAV_ITEMS.filter((item) => !item.visible || item.visible(access))

  return (
    // h-full = barre latérale bureau (bloc étiré en hauteur) ; flex-1 min-h-0 =
    // tiroir mobile (remplit la place restante sous l'en-tête) : la liste
    // défile et « Se déconnecter » reste épinglé en bas.
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto py-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                'group mx-3 flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                collapsed ? 'justify-center px-0' : '',
                isActive
                  ? 'bg-white text-fongo-900 shadow-sm'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            <i className={`${item.icon} text-base`} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Se déconnecter' : undefined}
          className={[
            'flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-red-500/15 hover:text-white',
            collapsed ? 'justify-center px-0' : '',
          ].join(' ')}
        >
          <i className="pi pi-sign-out text-base" />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </div>
  )
}

export function Layout() {
  const { user, canSee, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const access = useMemo<NavAccess>(() => ({ canSee }), [canSee])
  const roleText = useMemo(
    () => rolesLabel(user?.role, user?.roles_supplementaires),
    [user?.role, user?.roles_supplementaires],
  )

  const pageTitle = useMemo(() => {
    const item = NAV_ITEMS.find((entry) => location.pathname.startsWith(entry.to))
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

  function handleLogout() {
    setProfileMenuOpen(false)
    setMobileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  function goTo(to: string) {
    setProfileMenuOpen(false)
    navigate(to)
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-fongo-900">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <i className="pi pi-bars text-lg" />
          </button>
          <Logo />
        </div>

        <div className="hidden flex-1 text-center md:block">
          <h1 className="text-base font-semibold text-white">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 md:flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Réduire le menu latéral"
          >
            <i className={`pi ${collapsed ? 'pi-angle-right' : 'pi-angle-left'}`} />
          </button>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
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
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => goTo('/parametres')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <i className="pi pi-user text-slate-400" />
                    Mon profil
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => goTo('/parametres?tab=securite')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <i className="pi pi-lock text-slate-400" />
                    Sécurité
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <i className="pi pi-sign-out" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`hidden shrink-0 transition-all duration-300 md:block ${
            collapsed ? 'w-20' : 'w-64 lg:w-72'
          }`}
        >
          <SidebarContent
            access={access}
            collapsed={collapsed}
            onLogout={handleLogout}
          />
        </aside>

        <section className="flex-1 overflow-y-auto rounded-tl-3xl bg-white scrollbar-thin">
          <div className="mx-auto min-h-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<DefaultPageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </section>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-fongo-900 shadow-2xl md:hidden">
            <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:h-20">
              <Logo />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
              >
                <i className="pi pi-times" />
              </button>
            </div>
            <SidebarContent
              access={access}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </>
      )}
    </div>
  )
}
