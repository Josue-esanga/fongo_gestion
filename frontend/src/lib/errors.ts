import axios, { type AxiosError } from 'axios'
import { tokenStorage } from '@/lib/storage'

/**
 * Message explicite renvoyé par l'API (format DRF `{ detail: … }`).
 *
 * On ne retient que les messages courts et simples, écrits pour être lus par
 * un utilisateur : jamais de pile d'appels, de HTML ou de détail technique.
 */
function serverDetail(error: AxiosError): string | null {
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null

  const detail = (data as { detail?: unknown }).detail
  if (typeof detail !== 'string') return null

  const message = detail.trim()
  if (!message || message.length > 300) return null
  if (/[<>{}]|traceback|stack trace/i.test(message)) return null
  return message
}

/**
 * Refus d'accès (403) sans message serveur : reformulé selon le rôle de
 * l'utilisateur connecté, pour qu'il sache qui solliciter.
 */
function deniedMessage(): string {
  const role = tokenStorage.getUser()?.role

  if (role === 'stagiaire') {
    return "Votre compte de stagiaire ne permet pas cette action. Adressez-vous à un administrateur si vous en avez besoin."
  }
  if (role === 'admin') {
    return "Votre compte administrateur ne dispose pas de ce droit pour le moment. Demandez l'autorisation au super administrateur."
  }
  if (role === 'super_admin') {
    return 'Cette action est refusée pour votre compte. Rechargez la page et réessayez.'
  }
  return "Vous n'avez pas les droits nécessaires pour cette action."
}

/**
 * Refus d'accès : le backend formule déjà le refus en fonction du rôle
 * (« Seul le super administrateur peut modifier… », « Action réservée aux
 * caissiers… »). On affiche ce message, et on complète uniquement s'il
 * n'indique pas à qui s'adresser.
 */
function accessDeniedMessage(error: AxiosError): string {
  const detail = serverDetail(error)
  if (!detail) return deniedMessage()

  if (/contact|administrateur|adressez/i.test(detail)) return detail
  return `${detail} Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur.`
}

/**
 * Transforme une erreur (Axios ou JavaScript) en un message utilisateur sûr.
 *
 * Aucun détail technique brut (stack trace, message serveur, code interne)
 * n’est jamais exposé à l’utilisateur final. On se base sur le code HTTP, le
 * type d’erreur réseau, et sur les messages d’usage déjà rédigés par le
 * serveur (refus d’accès adaptés au rôle).
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    // `config.url` est relatif (« auth/token/ ») : on cherche donc
    // « auth/token » sans slash initial, sinon la connexion serait prise pour
    // une requête métier et un mauvais mot de passe afficherait « session
    // expirée ».
    const isAuthRequest = (error.config?.url ?? '').includes('auth/token')

    // Connexion refusée : on affiche le message serveur (traduit en français)
    // avec, à défaut, une reformulation claire — jamais « session expirée »,
    // qui serait fausse sur un mauvais mot de passe.
    if (status === 401 && isAuthRequest) {
      return (
        serverDetail(error) ??
        "Identifiants incorrects. Vérifiez votre nom d'utilisateur et votre mot de passe."
      )
    }

    // Sur une requête métier, un 401 signifie que la session n’est plus
    // utilisable : on affiche un message clair au lieu du détail technique
    // renvoyé par le serveur.
    if (status === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
    }

    if (status === 403) {
      return accessDeniedMessage(error)
    }
    if (status === 404) {
      return 'La ressource demandée est introuvable.'
    }
    if (status === 429) {
      return 'Trop de requêtes envoyées. Patientez quelques instants.'
    }
    if (status === 400) {
      const detail = serverDetail(error)
      return detail ?? 'La demande n’est pas valide. Vérifiez les informations saisies.'
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
