import { z } from 'zod'

export const profileSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire.'),
  last_name: z.string().min(1, 'Le nom est obligatoire.'),
  email: z.string().email('Adresse e-mail invalide.').or(z.literal('')),
})

export const passwordSchema = z
  .object({
    old_password: z.string().min(1, "L'ancien mot de passe est obligatoire."),
    new_password: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
    confirm_password: z.string().min(1, 'Confirmez le nouveau mot de passe.'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirm_password'],
  })

export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordValues = z.infer<typeof passwordSchema>
