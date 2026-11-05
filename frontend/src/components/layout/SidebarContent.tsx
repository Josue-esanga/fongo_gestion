import { NavLink, useLocation } from 'react-router-dom'
import {
  NAV_ITEMS,
  type NavAccess,
  type NavCounts,
} from '@/components/layout/navigation'
import { Icon } from '@/components/Icon'
import { prefetchRoute } from '@/lib/routePrefetch'

export function SidebarContent({
  access,
  counts = {},
  collapsed = false,
  onNavigate,
  onLogout,
}: {
  access: NavAccess
  /** Compteurs (devoirs, annonces) affichés en pastille. */
  counts?: NavCounts
  collapsed?: boolean
  onNavigate?: () => void
  onLogout: () => void
}) {
  const location = useLocation()
  const items = NAV_ITEMS.filter((item) => !item.visible || item.visible(access))

  return (
    // h-full = barre latérale bureau (bloc étiré en hauteur) ; flex-1 min-h-0 =
    // tiroir mobile (remplit la place restante sous l'en-tête) : la liste
    // défile et « Se déconnecter » reste épinglé en bas.
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <nav className="sidebar-nav flex-1 space-y-1 overflow-y-auto pb-5 pt-8">
        {items.map((item) => {
          const count = item.badge ? (counts[item.badge] ?? 0) : 0
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              onMouseEnter={() => {
                // Ne pré-charge pas la page déjà affichée.
                if (!isActive) prefetchRoute(item.to)
              }}
              title={collapsed ? item.label : undefined}
              className={({ isActive: active }) =>
                [
                  'group relative flex items-center gap-4 px-4 py-3 text-sm font-semibold transition',
                  collapsed ? 'justify-center px-0' : '',
                  active
                    ? // Onglet actif : il touche le bord droit de la sidebar pour
                      // se fondre dans le contenu clair (coins inversés en CSS).
                      'sidebar-tab z-10 ml-3 rounded-l-full bg-white text-fongo-900'
                    : 'mx-3 rounded-2xl text-blue-100 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className={`${item.icon} text-base`} />
              {!collapsed && <span>{item.label}</span>}

              {/* Pastille de compteur (Devoirs, Annonces). */}
              {!collapsed && count > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isActive
                      ? 'bg-fongo-700 text-white'
                      : 'bg-white/15 text-white group-hover:bg-white/25'
                  }`}
                >
                  {count}
                </span>
              )}
              {collapsed && count > 0 && (
                <span
                  className={`absolute right-1.5 top-1.5 min-w-[1.2rem] rounded-full px-1 text-center text-[10px] font-bold leading-4 ${
                    isActive ? 'bg-fongo-700 text-white' : 'bg-white text-fongo-900'
                  }`}
                >
                  {count}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button type="button"
          
          onClick={onLogout}
          title={collapsed ? 'Se déconnecter' : undefined}
          className={[
            'flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-red-500/15 hover:text-white',
            collapsed ? 'justify-center px-0' : '',
          ].join(' ')}
        >
          <Icon className="pi pi-sign-out text-base" />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </div>
  )
}
