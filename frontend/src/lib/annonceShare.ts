import type { Annonce } from '@/types'
import { formatDate } from '@/lib/format'

/**
 * Partage d'annonce **sous forme d'image** (WhatsApp, Facebook).
 *
 * L'annonce est rendue dans un canvas (1080 × 1080) puis envoyée en PNG via
 * l'API Web Share quand elle est disponible (mobile) : rien n'est jamais
 * partagé « en code » ni en texte brut. À défaut, l'image est téléchargée et
 * la plateforme ouverte, avec une consigne de partage manuel.
 */

export type ShareTarget = 'whatsapp' | 'facebook'
export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

const WIDTH = 1080
const HEIGHT = 1080
const PADDING = 72
const FONT = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const SHARE_URLS: Record<ShareTarget, string> = {
  whatsapp:
    typeof navigator !== 'undefined' &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent)
      ? 'whatsapp://'
      : 'https://web.whatsapp.com/',
  facebook: 'https://www.facebook.com/',
}

/** Charge une image sans « tinter » le canvas (sinon `toBlob` échoue). */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

/** Découpe un texte en lignes tenant dans `maxWidth` (max `maxLines`). */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let line = ''
  let truncated = false

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length >= maxLines) {
        truncated = true
        break
      }
    } else {
      line = candidate
    }
  }
  if (!truncated && line) {
    if (lines.length < maxLines) {
      lines.push(line)
    } else {
      // Il reste du texte après la dernière ligne : on le signale.
      truncated = true
    }
  }
  if (truncated && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[,.;:…]+$/, '')}…`
  }
  return lines
}

/**
 * Dessine l'annonce dans un canvas et renvoie le PNG.
 * Une image d'annonce indisponible (CORS,404) ne fait pas échouer le rendu :
 * seule la partie texte est alors dessinée.
 */
export async function renderAnnonceImage(annonce: Annonce): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Le navigateur ne permet pas de générer l'image.")

  // --- Fond bleu nuit + halo cyan (palette FongoLab) ---------------------
  const background = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  background.addColorStop(0, '#0b1a63')
  background.addColorStop(1, '#020344')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.save()
  const halo = ctx.createRadialGradient(
    WIDTH - 140,
    120,
    20,
    WIDTH - 140,
    120,
    520,
  )
  halo.addColorStop(0, 'rgba(34, 211, 238, 0.35)')
  halo.addColorStop(1, 'rgba(34, 211, 238, 0)')
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.restore()

  // --- Bandeau « FongoLab » ---------------------------------------------
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
  roundRect(ctx, PADDING, PADDING, 268, 76, 38)
  ctx.fill()
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#67e8f9'
  ctx.font = `800 34px ${FONT}`
  ctx.fillText('FongoLab', PADDING + 32, PADDING + 40)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = `700 24px ${FONT}`
  ctx.textAlign = 'right'
  ctx.fillText('ANNONCE DU CLUB', WIDTH - PADDING, PADDING + 40)
  ctx.textAlign = 'left'

  // --- Image de l'annonce (facultative) ----------------------------------
  let y = PADDING + 128
  const image = annonce.image1 ? await loadImage(annonce.image1) : null

  if (image && image.width > 0 && image.height > 0) {
    const boxWidth = WIDTH - PADDING * 2
    const boxHeight = 420
    const scale = Math.max(boxWidth / image.width, boxHeight / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale

    ctx.save()
    roundRect(ctx, PADDING, y, boxWidth, boxHeight, 36)
    ctx.clip()
    ctx.drawImage(
      image,
      PADDING + (boxWidth - drawWidth) / 2,
      y + (boxHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    )
    ctx.restore()
    y += boxHeight + 44
  }

  // --- Titre --------------------------------------------------------------
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 56px ${FONT}`
  ctx.textBaseline = 'top'
  const titleLines = wrapLines(ctx, annonce.object, WIDTH - PADDING * 2, 2)
  for (const line of titleLines) {
    ctx.fillText(line, PADDING, y)
    y += 68
  }
  y += 20

  // --- Contenu ------------------------------------------------------------
  const footerY = HEIGHT - PADDING - 56
  const available = footerY - 40 - y
  const maxContentLines = Math.max(3, Math.floor(available / 48))
  // La police doit être posée AVANT le mesure des lignes (wrapLines).
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)'
  ctx.font = `500 34px ${FONT}`
  const contentLines = wrapLines(
    ctx,
    annonce.contenu,
    WIDTH - PADDING * 2,
    maxContentLines,
  )
  for (const line of contentLines) {
    ctx.fillText(line, PADDING, y)
    y += 48
  }

  // --- Pied de page -------------------------------------------------------
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PADDING, footerY - 34)
  ctx.lineTo(WIDTH - PADDING, footerY - 34)
  ctx.stroke()

  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.font = `600 26px ${FONT}`
  ctx.fillText(`Prévue le ${formatDate(annonce.date_prevue)}`, PADDING, footerY)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#67e8f9'
  ctx.fillText('FongoLab · Burundi', WIDTH - PADDING, footerY)
  ctx.textAlign = 'left'

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Impossible de générer l'image de l'annonce.")),
      'image/png',
      0.95,
    )
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function annonceFilename(annonce: Annonce): string {
  const slug = annonce.object
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
  return `fongolab-${slug || 'annonce'}-${annonce.id}.png`
}

/**
 * Partage l'annonce en image sur WhatsApp ou Facebook.
 *
 * @param blob PNG déjà généré (aperçu) : si fourni, c'est lui qui part, ce
 *   qui garantit que l'image partagée est exactement celle affichée.
 *
 * - `shared` : le système a partagé le PNG (Web Share API) ;
 * - `downloaded` : pas de partage natif → le PNG est téléchargé, la
 *   plateforme reste à ouvrir par l'utilisateur (clic, jamais de popup) ;
 * - `cancelled` : l'utilisateur a annulé le partage natif.
 */
export async function shareAnnonceImage(
  annonce: Annonce,
  blob?: Blob,
): Promise<{ result: ShareResult; blob: Blob }> {
  const image = blob ?? (await renderAnnonceImage(annonce))
  const filename = annonceFilename(annonce)
  const file =
    typeof File !== 'undefined'
      ? new File([image], filename, { type: 'image/png' })
      : null

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
  }
  const canShareFiles = Boolean(
    file &&
      typeof nav.share === 'function' &&
      nav.canShare?.({ files: [file] }),
  )

  if (canShareFiles && file) {
    try {
      // Uniquement le PNG : jamais de texte ni de « code » d'annonce.
      await nav.share({ files: [file], title: annonce.object })
      return { result: 'shared', blob: image }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { result: 'cancelled', blob: image }
      }
      // Autre refus (plateforme non prise en charge) → repli téléchargement.
    }
  }

  downloadBlob(image, filename)
  return { result: 'downloaded', blob: image }
}

/** Télécharge simplement le PNG de l'annonce (bouton dédié). */
export async function downloadAnnonceImage(
  annonce: Annonce,
  blob?: Blob,
): Promise<Blob> {
  const image = blob ?? (await renderAnnonceImage(annonce))
  downloadBlob(image, annonceFilename(annonce))
  return image
}

/** Ouvre WhatsApp ou Facebook (appelé depuis un clic → jamais bloqué). */
export function openSharePlatform(target: ShareTarget) {
  window.open(SHARE_URLS[target], '_blank', 'noopener,noreferrer')
}

/** Nom de la plateforme pour les messages. */
export function shareTargetLabel(target: ShareTarget): string {
  return target === 'whatsapp' ? 'WhatsApp' : 'Facebook'
}
