export type Role = 'super_admin' | 'admin' | 'stagiaire'

/** Rôles supplémentaires attribuables à un admin par le super administrateur. */
export type RoleSupplementaire = 'formateur' | 'caissier'

export interface UserLite {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  role: Role
  roles_supplementaires?: RoleSupplementaire[]
  pictures: string | null
}

export interface User extends UserLite {
  role_display?: string
  is_active: boolean
  is_superuser?: boolean
  date_joined: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface AuthTokens {
  access: string
  refresh: string
  user: User
}

export interface Annonce {
  id: number
  object: string
  contenu: string
  poster_a: string
  auteur: UserLite
}

export interface Devoir {
  id: number
  title: string
  description: string
  limit_date: string
  created_at: string
  is_expired: boolean
}

export type CategoriePaiement = 'module' | 'autres'

export interface Paiement {
  id: number
  montant: number
  category: CategoriePaiement
  description: string
  created_at: string
  stagiaire: UserLite
}

export interface StagiaireFinance extends UserLite {
  total_paye: number
  dernier_paiement: string | null
}

export interface EventItem {
  id: number
  title: string
  description: string
  date: string
  dirigent: UserLite
  created_at: string
}

export interface ModuleFormation {
  id: number
  cours: string
  duree: number
  formateur_nom: string
}

/** Module de la grille pédagogique affiché dans l'option « Modules ». */
export interface ModulePedagogique {
  id: number
  ordre: number
  titre: string
  sujets: string[]
  description: string
}

/** Séance d'appel rattachée à un QR code (option Présences). */
export interface SeancePresence {
  id: number
  libelle: string
  date: string
  /** Jour de formation concerné, ex. « lundi » (classement par jour). */
  jour_semaine: string
  ouverte: boolean
  /** Contenu encodé dans le QR code affiché en salle. */
  qr_payload: string
  total_stagiaires: number
  presents: number
  absents: number
  creee_par_nom: string | null
  created_at: string
}

/** Stagiaire + statut d'une séance (présent si le QR a été scanné). */
export interface ParticipantPresence {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  pictures: string | null
  present: boolean
  horodatage: string | null
}

/** Statut personnel du stagiaire connecté (tableau de bord). */
export interface MaPresence {
  present: boolean
  horodatage: string | null
  appel_ouvert: boolean
  libelle: string | null
}

export interface Formateur {
  id: number
  user: UserLite
  username: string
  email: string
  pictures: string | null
  matiere: string
  bio: string
  modules: ModuleFormation[]
}

export interface FinanceOverview {
  total_collecte: number
  nombre_paiements: number
  nombre_stagiaires: number
}

export interface DashboardData {
  utilisateur: {
    id: number
    username: string
    full_name: string
    role: Role
    pictures: string | null
  }
  finance: {
    total_collecte: number
    nombre_paiements: number
  }
  compteurs: {
    membres: number
    stagiaires: number
    formateurs: number
  }
  activite: {
    annonces: number
    devoirs: number
    evenements: number
  }
  dernieres_annonces: Array<{
    id: number
    object: string
    poster_a: string
    auteur__username: string
  }>
  prochains_evenements: Array<{
    id: number
    title: string
    date: string
    dirigent__username: string
  }>
  repartition_roles: Array<{ role: Role; nombre: number }>
}

export interface Configuration {
  id: number
  nom_club: string
  logo: string | null
  frais_formation: number
}
