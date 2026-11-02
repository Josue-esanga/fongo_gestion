/**
 * Paiement mobile du club (Burundi).
 *
 * Numéro Lumicash sur lequel les stagiaires effectuent leur versement avant
 * de déposer leur demande dans l'application. Surchargeable sans recompilation
 * via la variable d'environnement `VITE_LUMICASH_NUMBER` (fichier `.env`).
 */
export const LUMICASH_NUMBER: string =
  import.meta.env.VITE_LUMICASH_NUMBER?.trim() || '+257 79 00 00 00'

/** Libellé du canal affiché aux stagiaires. */
export const LUMICASH_LABEL = 'Lumicash'

/**
 * Copie le numéro Lumicash dans le presse-papiers.
 * Retourne `false` si le presse-papiers n'est pas disponible.
 */
export async function copyLumicashNumber(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(LUMICASH_NUMBER)
    return true
  } catch {
    return false
  }
}
