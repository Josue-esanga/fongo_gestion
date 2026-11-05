/**
 * Déduplication des appels API en cours.
 *
 * Problème : si plusieurs composants montent simultanément et demandent la
 * même ressource (ex: liste des annonces, profil utilisateur), chaque
 * composant déclenche sa propre requête HTTP. Cela surcharge le backend et
 * peut provoquer des conditions de race.
 *
 * Solution : on garde une Map des promesses en cours, indexées par une clé
 * (méthode + URL + paramètres sérialisés). Tant qu'une requête avec la même
 * clé est en cours, les appelants suivants réutilisent la promesse existante
 * au lieu d'en lancer une nouvelle.
 *
 * Quand la promesse se résout (succès ou échec), l'entrée est retirée de la
 * Map pour qu'une nouvelle requête puisse être lancée ensuite.
 */

type RequestKey = string

// Map : clé de requête → promesse en cours
const inFlight = new Map<RequestKey, Promise<unknown>>()

/**
 * Génère une clé stable à partir de la méthode, de l'URL et des params/body.
 */
function requestKey(
  method: string,
  url: string,
  params?: Record<string, unknown>,
  data?: unknown,
): RequestKey {
  const payload = JSON.stringify({ params, data })
  return `${method.toUpperCase()} ${url} ${payload}`
}

/**
 * Enveloppe un appel axios pour le dédupliquer.
 *
 * @param key - Clé unique de la requête
 * @param fn - Fonction qui exécute l'appel axios (retourne une Promise)
 * @returns La promesse du résultat (partagée si déjà en cours)
 */
export async function dedupRequest<T>(
  key: RequestKey,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inFlight.get(key)

  if (existing) {
    return existing as Promise<T>
  }

  const promise = fn().finally(() => {
    // Nettoyage : retire l'entrée une fois la requête terminée
    // (succès ou échec) pour autoriser une nouvelle requête identique.
    inFlight.delete(key)
  })

  inFlight.set(key, promise)

  return promise as Promise<T>
}

/**
 * Crée une clé de requête pour un appel GET.
 */
export function getKey(url: string, params?: Record<string, unknown>): RequestKey {
  return requestKey('GET', url, params)
}

/**
 * Crée une clé de requête pour un appel POST/PUT/PATCH/DELETE.
 */
export function writeKey(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
): RequestKey {
  return requestKey(method, url, undefined, data)
}

/**
 * Vide toutes les requêtes en cours (utile au déconnexion ou changement de contexte).
 */
export function clearDedupCache(): void {
  inFlight.clear()
}
