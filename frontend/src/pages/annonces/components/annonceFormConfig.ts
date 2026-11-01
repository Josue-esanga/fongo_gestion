import { z } from 'zod'
import type { AnnonceCible, AnnonceTemplate } from '@/types'

export const annonceSchema = z.object({
  object: z.string().min(3, "L'objet doit contenir au moins 3 caractères."),
  contenu: z.string().min(5, 'Le contenu doit contenir au moins 5 caractères.'),
  cible: z.enum(['tous', 'admins', 'stagiaires']),
  template: z.enum(['standard', 'fongo_expo']),
  date_prevue: z.date({ message: 'La date de prévision est obligatoire.' }),
})

export type AnnonceFormValues = z.infer<typeof annonceSchema>

/** Publics visés par une annonce. */
export const CIBLE_OPTIONS: Array<{ label: string; value: AnnonceCible }> = [
  { label: 'Tout le monde', value: 'tous' },
  { label: 'Administrateurs & super admins', value: 'admins' },
  { label: 'Stagiaires', value: 'stagiaires' },
]

/** Modèles d'affichage d'une annonce. */
export const TEMPLATE_OPTIONS: Array<{
  label: string
  value: AnnonceTemplate
  icon: string
  description: string
}> = [
  {
    label: 'Standard',
    value: 'standard',
    icon: 'pi pi-file-edit',
    description: 'Une carte texte classique, claire et lisible.',
  },
  {
    label: 'FongoExpo session',
    value: 'fongo_expo',
    icon: 'pi pi-images',
    description: "L'affiche bleue avec les cartes mystère.",
  },
]
