import { Suspense, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import { Logo } from '@/components/Logo'
import { Icon } from '@/components/Icon'
import { DefaultPageSkeleton } from '@/components/Skeletons'
import { SidebarContent } from '@/components/layout/SidebarContent'
import { Topbar } from '@/components/layout/Topbar'
import {
  type NavAccess,
  type NavCounts,
} from '@/components/layout/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSEO } from '@/hooks/useSEO'

export function Layout() {
  const { canSee, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Balises SEO dynamiques selon la route (title, description, Open Graph…)
  useSEO()

  const access = useMemo<NavAccess>(() => ({ canSee }), [canSee])
  // Compteurs affichés en pastille dans le menu : même requête (et même cache
  // React Query) que le tableau de bord.
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    staleTime: 60_000,
    retry: false,
  })
  const counts = useMemo<NavCounts>(
    () => ({
      devoirs: dashboard?.activite.devoirs ?? 0,
      annonces: dashboard?.activite.annonces ?? 0,
    }),
    [dashboard],
  )

  function handleLogout() {
    setMobileOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-fongo-900">
      <Topbar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        onOpenMobile={() => setMobileOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`hidden shrink-0 transition-all duration-300 md:block ${
            collapsed ? 'w-20' : 'w-64 lg:w-72'
          }`}
        >
          <SidebarContent
            access={access}
            counts={counts}
            collapsed={collapsed}
            onLogout={handleLogout}
          />
        </aside>

        {/* overflow-x-hidden : aucun défilement horizontal possible sur
            mobile, quelle que soit la largeur d'un contenu (titres longs,
            affiche FongoExpo…). */}
        <section className="flex-1 overflow-x-hidden overflow-y-auto rounded-tl-3xl bg-white scrollbar-thin">
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
                <Icon className="pi pi-times" />
              </button>
            </div>
            <SidebarContent
              access={access}
              counts={counts}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </>
      )}
    </div>
  )
}
