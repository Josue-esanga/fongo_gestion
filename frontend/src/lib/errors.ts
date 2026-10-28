import axios from 'axios'

const FIELD_LABELS: Record<string, string> = {
  username: "Nom d'utilisateur",
  password: 'Mot de passe',
  email: 'Adresse e-mail',
  first_name: 'Prénom',
  last_name: 'Nom',
  role: 'Rôle',
  pictures: 'Photo de profil',
  montant: 'Montant',
  category: 'Catégorie',
  description: 'Description',
  id_stagiaire: 'Stagiaire',
  title: 'Titre',
  object: 'Objet',
  contenu: 'Contenu',
  limit_date: 'Date limite',
  date: 'Date',
  user_id: 'Utilisateur',
  matiere: 'Matière',
  bio: 'Biographie',
  old_password: 'Ancien mot de passe',
  new_password: 'Nouveau mot de passe',
  confirm_password: 'Confirmation',
  detail: 'Erreur',
  non_field_errors: 'Erreur',
}

function normalizeMessage(value: string): string | null {
  const message = value.trim()
  if (!message || message.startsWith('<')) return null
  return message.length > 300 ? `${message.slice(0, 300)}…` : message
}

function flatten(value: unknown): string | null {
  if (typeof value === 'string') return normalizeMessage(value)
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = flatten(item)
      if (message) return message
    }
    return null
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const message = flatten(item)
      if (message) return message
    }
  }
  return null
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === 'string') {
      const message = normalizeMessage(data)
      if (message) return message
    }

    if (Array.isArray(data)) {
      const message = flatten(data)
      if (message) return message
    } else if (data && typeof data === 'object') {
      for (const [field, value] of Object.entries(
        data as Record<string, unknown>,
      )) {
        const message = flatten(value)
        if (message) {
          const label = FIELD_LABELS[field] ?? field
          return label === 'Erreur' ? message : `${label} : ${message}`
        }
      }
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Impossible de joindre le serveur. Vérifiez votre connexion ou que le backend est démarré.'
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
    }

    const status = error.response?.status
    if (status === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.'
    }
    if (status === 403) {
      return "Vous n'avez pas les droits nécessaires pour effectuer cette action."
    }
    if (status === 404) {
      return 'La ressource demandée est introuvable.'
    }
    if (status === 429) {
      return 'Trop de requêtes envoyées. Patientez quelques instants avant de réessayer.'
    }
    if (status && status >= 500) {
      return 'Le serveur a rencontré une erreur. Veuillez réessayer dans un instant.'
    }

    return error.message || 'Une erreur est survenue.'
  }

  if (error instanceof Error) return error.message
  return 'Une erreur inattendue est survenue.'
}
