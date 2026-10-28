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

export function toDateTimeLocal(value?: string | null): string {
  if (!value) return ''
  return dayjs(value).format('YYYY-MM-DDTHH:mm')
}
