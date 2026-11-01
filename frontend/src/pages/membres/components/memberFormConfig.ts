import { z } from 'zod'
import type { Role, RoleSupplementaire } from '@/types'

export const memberSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire.'),
  last_name: z.string().min(1, 'Le nom est obligatoire.'),
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères."),
  email: z
    .string()
    .email('Adresse e-mail invalide.')
    .or(z.literal(''))
    .optional(),
  role: z.enum(['super_admin', 'admin', 'stagiaire']),
  roles_supplementaires: z
    .array(z.enum(['formateur', 'caissier', 'communication']))
    .optional(),
  password: z.string().optional(),
})

export type MemberFormValues = z.infer<typeof memberSchema>

export const ROLE_OPTIONS: Array<{ label: string; value: Role }> = [
  { label: 'Stagiaire', value: 'stagiaire' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Super administrateur', value: 'super_admin' },
]

// Rôles attribuables à un admin, attribués par le super administrateur.
export const EXTRA_ROLE_OPTIONS: Array<{
  label: string
  value: RoleSupplementaire
  hint: string
}> = [
  { label: 'Formateur', value: 'formateur', hint: 'CRUD des devoirs' },
  { label: 'Caissier', value: 'caissier', hint: 'CRUD de la finance' },
  {
    label: 'Communication',
    value: 'communication',
    hint: 'Publication des annonces',
  },
]
