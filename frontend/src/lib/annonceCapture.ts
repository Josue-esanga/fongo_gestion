import { toPng } from 'html-to-image'
import { annoncesApi } from '@/api/annonces'
import type { Annonce } from '@/types'

/**
 * Capture de l'annonce **telle qu'affichée**.
 *
 * La carte porte l'attribut `data-annonce-card` (page Annonces et page
 * d'accueil) : on la photographie telle quelle, sans rien ajouter ni retirer,
 * puis on dépose le PNG côté serveur (`poster`) — c'est cette image qui sert
 * de téléchargement, d'image du partage et d'aperçu du lien partagé.
 */

export function annonceCardSelector(id: number): string {
  return `[data-annonce-card="${id}"]`
}

/** Attends que la carte soit rendue (rafraîchissement de la liste). */
export async function waitForAnnonceCard(
  id: number,
  timeout = 4000,
): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeout
  for (;;) {
    const node = document.querySelector<HTMLElement>(annonceCardSelector(id))
    if (node) return node
    if (Date.now() > deadline) return null
    await new Promise((resolve) => window.setTimeout(resolve, 120))
  }
}

/**
 * Photographie la carte affichée → PNG. Renvoie `null` si la carte n'est pas
 * affichée ou si la capture échoue (images non autorisées, navigateur
 * restrictif) : le partage reste alors possible avec le seul lien.
 */
export async function captureAnnonceCard(id: number): Promise<Blob | null> {
  const node = document.querySelector<HTMLElement>(annonceCardSelector(id))
  if (!node) return null

  try {
    const dataUrl = await toPng(node, {
      // Résolution nette (WhatsApp / Facebook réduisent l'image).
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    })
    const response = await fetch(dataUrl)
    return await response.blob()
  } catch (cause) {
    console.warn("Capture de l'annonce impossible :", cause)
    return null
  }
}

/**
 * Capture la carte puis l'envoie au serveur comme « poster » de partage.
 * Renvoie l'annonce mise à jour (avec son `poster`), ou `null` si la capture
 * ou l'envoi échoue — sans jamais bloquer l'utilisateur.
 */
export async function captureAndUploadPoster(id: number): Promise<Annonce | null> {
  await waitForAnnonceCard(id)
  const image = await captureAnnonceCard(id)
  if (!image) return null

  try {
    return await annoncesApi.uploadPoster(id, image)
  } catch (cause) {
    console.warn("Enregistrement de la capture impossible :", cause)
    return null
  }
}
