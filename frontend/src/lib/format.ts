import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  return dayjs(value).format('DD/MM/YYYY')
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return dayjs(value).format('DD/MM/YYYY à HH:mm')
}

export function formatLongDate(value?: string | null): string {
  if (!value) return '—'
  return dayjs(value).format('D MMMM YYYY')
}

export function formatMoney(value?: number | null): string {
  return `${new Intl.NumberFormat('fr-FR').format(value ?? 0)} FBu`
}

export function initials(firstName?: string, lastName?: string, fallback = 'FG') {
  const value = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.trim()
  return value ? value.toUpperCase() : fallback.toUpperCase()
}

export function roleLabel(role?: string): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'admin':
      return 'Administrateur'
    case 'stagiaire':
      return 'Stagiaire'
    default:
      return 'Utilisateur'
  }
}

export function extraRoleLabel(code?: string): string {
  switch (code) {
    case 'formateur':
      return 'Formateur'
    case 'caissier':
      return 'Caissier'
    case 'communication':
      return 'Communication'
    default:
      return code ? String(code) : ''
  }
}

/** Rôle principal complété par les rôles supplémentaires, ex. « Administrateur · Caissier ». */
export function rolesLabel(role?: string, extras?: string[] | null): string {
  const base = roleLabel(role)
  const extra = (extras ?? []).map(extraRoleLabel).filter(Boolean)
  return extra.length ? `${base} · ${extra.join(' · ')}` : base
}

export function toDateTimeLocal(value?: string | null): string {
  if (!value) return ''
  return dayjs(value).format('YYYY-MM-DDTHH:mm')
}

/**
 * Extrait tronqué d'un texte (sous-titre de l'affiche FongoExpo) :
 * espaces normalisés, + « … » au-delà de `max` caractères.
 */
export function truncateText(text: string, max = 140): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > max ? `${oneLine.slice(0, max).trimEnd()}…` : oneLine
}

/** Libellé du public visé par une annonce (« tous » → Tout le monde). */
export function annonceCibleLabel(cible?: string | null): string {
  switch (cible) {
    case 'admins':
      return 'Administrateurs'
    case 'stagiaires':
      return 'Stagiaires'
    default:
      return 'Tout le monde'
  }
}

/** Couleur du badge de public visé. */
export function annonceCibleSeverity(
  cible?: string | null,
): 'secondary' | 'info' | 'success' {
  switch (cible) {
    case 'admins':
      return 'info'
    case 'stagiaires':
      return 'success'
    default:
      return 'secondary'
  }
}
