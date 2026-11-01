import type { Capability } from '@/contexts/AuthContext'

/** Sous-ensemble du contexte utilisé pour filtrer le menu latéral. */
export interface NavAccess {
  canSee: (capability: Capability) => boolean
}

/** Compteurs affichés en pastille dans le menu. */
export type NavCounts = Partial<Record<'devoirs' | 'annonces', number>>

export interface NavItem {
  label: string
  to: string
  icon: string
  /** Cache l'entrée lorsque le droit correspondant est absent. */
  visible?: (access: NavAccess) => boolean
  /** Clé du compteur à afficher en pastille (source : dashboard). */
  badge?: keyof NavCounts
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/dashboard', icon: 'pi pi-home' },
  {
    label: 'Membres',
    to: '/membres',
    icon: 'pi pi-users',
    visible: ({ canSee }) => canSee('membres'),
  },
  {
    label: 'Finance',
    to: '/finance',
    icon: 'pi pi-wallet',
    visible: ({ canSee }) => canSee('finance'),
  },
  { label: 'Devoirs', to: '/devoirs', icon: 'pi pi-file-edit', badge: 'devoirs' },
  {
    label: 'Planning',
    to: '/planning',
    icon: 'pi pi-calendar',
    visible: ({ canSee }) => canSee('planning'),
  },
  {
    label: 'Annonces',
    to: '/annonces',
    icon: 'pi pi-megaphone',
    badge: 'annonces',
  },
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
    visible: ({ canSee }) => canSee('presences'),
  },
  { label: 'Paramètres', to: '/parametres', icon: 'pi pi-cog' },
]
