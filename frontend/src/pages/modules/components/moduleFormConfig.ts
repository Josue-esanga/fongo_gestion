import { z } from 'zod'

export const moduleSchema = z.object({
  ordre: z
    .number({ message: "L'ordre est obligatoire." })
    .int("L'ordre doit être un nombre entier.")
    .min(1, "L'ordre doit être supérieur à zéro."),
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
  duree: z
    .number({ message: 'La durée est obligatoire.' })
    .int('La durée doit être un nombre entier d’heures.')
    .min(0, 'La durée ne peut pas être négative.'),
  sujets: z
    .string()
    .min(3, 'Indiquez au moins un sujet abordé dans ce module.'),
  description: z.string().optional(),
})

export type ModuleFormValues = z.infer<typeof moduleSchema>

// Durées courantes proposées dans le menu. « Saisir une autre durée » permet
// de choisir n'importe quelle valeur entière (heures), y compris une durée
// existante qui ne ferait pas partie de cette liste.
export const DUREE_PRESETS = [
  1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 48, 60, 80, 100,
]
export const DUREE_PRESET_SET = new Set(DUREE_PRESETS)
export const DUREE_OPTIONS = DUREE_PRESETS.map((value) => ({
  label: `${value} h`,
  value,
}))
