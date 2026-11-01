export type Role = 'super_admin' | 'admin' | 'stagiaire'

/** Rôles supplémentaires attribuables à un admin par le super administrateur. */
export type RoleSupplementaire = 'formateur' | 'caissier' | 'communication'

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

/** Public visé par une annonce. */
export type AnnonceCible = 'tous' | 'admins' | 'stagiaires'

/** Modèle d'affichage d'une annonce (carte texte ou affiche FongoExpo). */
export type AnnonceTemplate = 'standard' | 'fongo_expo'

export interface Annonce {
  id: number
  object: string
  contenu: string
  /** Public au destinataire l'annonce (« tous » = tout le monde). */
  cible: AnnonceCible
  /** Libellé lisible du public visé, renvoyé par l'API. */
  cible_display?: string
  /** Modèle d'affichage de l'annonce. */
  template: AnnonceTemplate
  /** Libellé lisible du modèle d'affichage, renvoyé par l'API. */
  template_display?: string
  /** Date et heure auxquelles l'annonce est prévue (ISO 8601). */
  date_prevue: string
  /** Image de la carte avant de l'affiche FongoExpo (URL). */
  image1?: string | null
  /** Image de la carte arrière de l'affiche FongoExpo (URL). */
  image2?: string | null
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

/** Moyen de paiement d'un versement. */
export type MoyenPaiement = 'cash' | 'lumicash'

/** Statut d'un versement : les demandes Lumicash démarrent « en attente ». */
export type StatutPaiement = 'valide' | 'en_attente' | 'refuse'

export interface Paiement {
  id: number
  montant: number
  category: CategoriePaiement
  /** Module payé (identifiant du module du projet). */
  module?: number | null
  /** Titre du module payé (null sur les versements antérieurs). */
  module_titre?: string | null
  /** Moyen de paiement (« cash » ou « lumicash »). */
  moyen?: MoyenPaiement
  /** Libellé lisible du moyen, renvoyé par l'API. */
  moyen_display?: string
  /** Statut du versement (« valide », « en_attente », « refuse »). */
  statut?: StatutPaiement
  /** Libellé lisible du statut, renvoyé par l'API. */
  statut_display?: string
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

/** Formateur résumé, joint aux modules qui lui sont affectés. */
export interface FormateurResume {
  id: number
  full_name: string
  matiere: string
}

/** Module de la grille pédagogique affiché dans l'option « Modules ». */
export interface ModuleFormation {
  id: number
  ordre: number
  titre: string
  /** Image de couverture du module (URL renvoyée par l'API). */
  image?: string | null
  /** Durée du module en heures. */
  duree: number
  sujets: string[]
  description: string
  /** Identifiants des formateurs affectés à ce module. */
  formateurs: number[]
  /** Formateurs affectés (détail lisible). */
  formateurs_detail?: FormateurResume[]
}

/** Module proposé dans les formulaires de paiement (caissier / Lumicash). */
export interface ModulePaiement {
  id: number
  titre: string
  /** Durée du module en heures. */
  duree: number
  ordre: number
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
  /** Identifiants des modules enseignés par ce formateur. */
  modules: number[]
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
    /** Date et heure prévues de l'annonce (ISO 8601). */
    date_prevue: string
    /** Modèle d'affichage (« standard » ou « fongo_expo »). */
    template?: AnnonceTemplate
    /** Contenu complet de l'annonce (sous-titre de l'affiche). */
    contenu?: string
    /** Image de la carte avant de l'affiche (URL). */
    image1?: string | null
    /** Image de la carte arrière de l'affiche (URL). */
    image2?: string | null
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
