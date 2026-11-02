import axios from 'axios'

/**
 * Transforme une erreur (Axios ou JavaScript) en un message utilisateur sûr.
 *
 * Aucun détail technique brut (stack trace, message serveur, code interne)
 * n’est jamais exposé à l’utilisateur final. On se base uniquement sur le
 * code HTTP et le type d’erreur réseau.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const isAuthRequest = error.config?.url?.includes('/auth/token')

    // Sur une requête métier, un 401 signifie que la session n’est plus
    // utilisable : on affiche un message clair au lieu du détail technique
    // renvoyé par le serveur.
    if (status === 401 && !isAuthRequest) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
    }

    if (status === 403) {
      return "Vous n'avez pas les droits nécessaires pour cette action."
    }
    if (status === 404) {
      return 'La ressource demandée est introuvable.'
    }
    if (status === 429) {
      return 'Trop de requêtes envoyées. Patientez quelques instants.'
    }
    if (status && status >= 500) {
      return 'Le serveur a rencontré une erreur. Veuillez réessayer plus tard.'
    }

    // Tout autre cas : message générique, jamais de détail technique.
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  // Erreur JavaScript non-Axios : jamais de message brut.
  return 'Une erreur inattendue est survenue.'
}
