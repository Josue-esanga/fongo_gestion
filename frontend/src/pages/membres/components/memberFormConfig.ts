import { z } from 'zod'
import type { Role, RoleSupplementaire } from '@/types'

export const memberSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire.'),
  last_name: z.string().min(1, 'Le nom est obligatoire.'),
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères."),
  role: z.enum(['super_admin', 'admin', 'stagiaire']),
  roles_supplementaires: z
    .array(
      z.enum([
        'formateur',
        'caissier',
        'communication',
        'frontend',
        'backend',
      ]),
    )
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

// Rôles attribuables à un stagiaire : ils déterminent les devoirs visibles
// (un devoir ciblé « backend » n'apparaît pas chez un stagiaire frontend).
export const STAGIAIRE_EXTRA_ROLE_OPTIONS: Array<{
  label: string
  value: RoleSupplementaire
  hint: string
}> = [
  {
    label: 'Frontend',
    value: 'frontend',
    hint: 'Devoirs réservés aux stagiaires frontend',
  },
  {
    label: 'Backend',
    value: 'backend',
    hint: 'Devoirs réservés aux stagiaires backend',
  },
]

/** Options de rôles supplémentaires selon le rôle principal choisi. */
export function extraRoleOptionsFor(role: Role): typeof EXTRA_ROLE_OPTIONS {
  if (role === 'admin') return EXTRA_ROLE_OPTIONS
  if (role === 'stagiaire') return STAGIAIRE_EXTRA_ROLE_OPTIONS
  return []
}
