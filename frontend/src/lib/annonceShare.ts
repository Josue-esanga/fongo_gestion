import type { Annonce } from '@/types'

/**
 * Partage d'une annonce : **image + lien**.
 *
 * - Le lien pointe vers la page publique de l'annonce (`/a/<id>/`, servie par
 *   le backend) qui porte les balises Open Graph : WhatsApp et Facebook y
 *   affichent automatiquement l'image et le titre de l'annonce.
 * - Sur mobile, l'API Web Share envoie **l'image et le lien ensemble** (l'image
 *   en légende du lien) : rien n'est téléchargé à la main.
 * - Sans partage natif (ordinateur), la plateforme s'ouvre directement avec le
 *   lien — l'aperçu image s'affiche tout seul.
 *
 * L'image partagée est la **capture du rendu affiché** (`annonceCapture`),
 * sans design ajouté ni retiré.
 */

export type ShareTarget = 'whatsapp' | 'facebook'
/** `shared` : partage natif · `link` : plateforme ouverte avec le lien. */
export type ShareOutcome = 'shared' | 'link' | 'cancelled'

/** Base du backend (page publique `/a/<id>/`). */
function backendBase(): string {
  const api = import.meta.env.VITE_API_URL?.trim()
  if (api) return api.replace(/\/api\/?$/, '')
  return (import.meta.env.VITE_BACKEND_URL?.trim() || '').replace(/\/+$/, '')
}

/** URL publique de l'annonce : ce que l'on partage. */
export function annoncePublicUrl(id: number): string {
  return `${backendBase()}/a/${id}/`
}

/** Lien de partage direct de la plateforme (aperçu géré par la plateforme). */
export function shareLink(target: ShareTarget, url: string): string {
  return target === 'whatsapp'
    ? `https://wa.me/?text=${encodeURIComponent(url)}`
    : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
}

export function shareTargetLabel(target: ShareTarget): string {
  return target === 'whatsapp' ? 'WhatsApp' : 'Facebook'
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function annonceImageFilename(annonce: Annonce): string {
  const slug = annonce.object
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
  return `fongolab-${slug || 'annonce'}-${annonce.id}.png`
}

function canShareFiles(file: File, url: string): boolean {
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
  }
  return Boolean(
    typeof nav.share === 'function' && nav.canShare?.({ files: [file], text: url }),
  )
}

/**
 * Partage l'annonce sur WhatsApp ou Facebook.
 *
 * @param image capture PNG du rendu affiché, si disponible.
 */
export async function shareAnnonce(
  annonce: Annonce,
  image: Blob | null,
  target: ShareTarget,
): Promise<ShareOutcome> {
  const url = annoncePublicUrl(annonce.id)
  const file = image
    ? new File([image], annonceImageFilename(annonce), { type: 'image/png' })
    : null

  // 1) Partage natif avec l'image + le lien (mobile) : WhatsApp reçoit
  //    l'image, le lien part en légende — aucun téléchargement manuel.
  if (file && canShareFiles(file, url)) {
    try {
      await navigator.share({
        files: [file],
        text: url,
        title: annonce.object,
      })
      return 'shared'
    } catch (error) {
      if (isAbort(error)) return 'cancelled'
      // Sinon : on ouvre la plateforme avec le lien (aperçu image compris).
    }
  }

  // 2) Repli : ouverture de la plateforme avec le lien. Appel fait dans le
  //    geste utilisateur (aucun `await` avant) → jamais bloqué en pop-up.
  window.open(shareLink(target, url), '_blank', 'noopener,noreferrer')
  return 'link'
}

/** Télécharge la capture du rendu affiché (PNG, rien d'ajouté). */
export function downloadAnnonceImage(image: Blob, annonce: Annonce): void {
  const url = URL.createObjectURL(image)
  const link = document.createElement('a')
  link.href = url
  link.download = annonceImageFilename(annonce)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Copie le lien public de l'annonce dans le presse-papiers. */
export async function copyAnnonceLink(annonce: Annonce): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(annoncePublicUrl(annonce.id))
    return true
  } catch {
    return false
  }
}
