/**
 * Registre des chargeurs de route par chemin, utilisé pour le prefetch au survol
 * des liens du menu.
 *
 * Principe : quand l'utilisateur survole un lien du menu, on déclenche
 * `import()` du chunk de la page cible afin qu'il soit déjà dans le cache HTTP
 * du navigateur au moment du clic. Le premier clic devient alors quasi instantané.
 *
 * Le prefetch est :
 *  - idempotent : un même chemin n'est préchargé qu'une fois,
 *  - non bloquant : il s'exécute via requestIdleCallback (fallback setTimeout)
 *    pour ne pas concurrencer le rendu en cours (préserve l'INP / Lighthouse),
 *  - silencieux en cas d'échec : c'est une optimisation, pas une erreur bloquante.
 */

const prefetchLoaders = new Map<string, () => Promise<unknown>>()
const prefetched = new Set<string>()

/**
 * Enregistre le chargeur d'une route. À appeler une fois par route (depuis
 * AppRoutes.tsx par exemple).
 */
export function registerPrefetch(to: string, loader: () => Promise<unknown>) {
  prefetchLoaders.set(to, loader)
}

/**
 * Précharge le chunk de la route `to`. Idempotent et non bloquant.
 */
export function prefetchRoute(to: string) {
  if (!to || prefetched.has(to) || !prefetchLoaders.has(to)) return

  const loader = prefetchLoaders.get(to)!
  prefetched.add(to)

  const schedule = (cb: () => void) =>
    // Safari ne supporte pas requestIdleCallback : fallback sur setTimeout.
    typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(cb, { timeout: 200 })
      : setTimeout(cb, 0)

  schedule(() => {
    void loader().catch(() => {
      // Échec silencieux : le prefetch est une optimisation progressive.
    })
  })
}
