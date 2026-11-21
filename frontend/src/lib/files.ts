/**
 * Aides à la gestion des fichiers joints (devoirs).
 *
 * Les règles (formats, poids) sont dupliquées côté serveur dans
 * `devoir/serializers.py` : le contrôle côté navigateur n'est qu'une
 * ergonomie, la sécurité reste côté API.
 */

/** Extensions acceptées pour un devoir joint (mises en minuscules). */
export const DEVOIR_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
] as const

/** Attribut `accept` du champ de sélection. */
export const DEVOIR_FILE_ACCEPT = DEVOIR_FILE_EXTENSIONS.join(',')

/** Poids maximal d'un fichier joint, en octets (10 Mo). */
export const MAX_DEVOIR_FILE_SIZE = 10 * 1024 * 1024

export type FileKind = 'pdf' | 'word' | 'image' | 'autre'

/** Catégorie d'un fichier, déduite de son extension. */
export function fileKind(name?: string | null): FileKind {
  const extension = name?.slice(name.lastIndexOf('.')).toLowerCase() ?? ''
  if (extension === '.pdf') return 'pdf'
  if (extension === '.doc' || extension === '.docx') return 'word'
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) {
    return 'image'
  }
  return 'autre'
}

/** Libellé de la catégorie (« Document PDF », « Image »…). */
export function fileKindLabel(name?: string | null): string {
  switch (fileKind(name)) {
    case 'pdf':
      return 'Document PDF'
    case 'word':
      return 'Document Word'
    case 'image':
      return 'Image'
    default:
      return 'Fichier'
  }
}

/** Icône PrimeIcons correspondant à la catégorie. */
export function fileKindIcon(name?: string | null): string {
  switch (fileKind(name)) {
    case 'pdf':
      return 'pi pi-file-pdf'
    case 'word':
      return 'pi pi-file-word'
    case 'image':
      return 'pi pi-image'
    default:
      return 'pi pi-file'
  }
}

/** Poids lisible (« 2,4 Mo », « 318 Ko »). */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/**
 * Contrôle un fichier avant envoi : format, poids, contenu non vide.
 * Retourne un message d'erreur, ou `null` si le fichier est acceptable.
 */
export function validateDevoirFile(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!DEVOIR_FILE_EXTENSIONS.includes(extension as (typeof DEVOIR_FILE_EXTENSIONS)[number])) {
    return `Format non accepté (${extension || 'inconnu'}). Formats autorisés : PDF, Word (.doc / .docx) et images (jpg, png, webp, gif).`
  }
  if (file.size === 0) return 'Le fichier sélectionné est vide.'
  if (file.size > MAX_DEVOIR_FILE_SIZE) {
    return `Le fichier dépasse la limite de 10 Mo (${formatFileSize(file.size)}).`
  }
  return null
}
