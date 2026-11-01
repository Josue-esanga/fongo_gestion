import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { ModuleFormation, Paginated } from '@/types'

export interface ModulePayload {
  ordre: number
  titre: string
  /** Durée du module en heures. */
  duree: number
  /** Liste des sujets abordés dans le module. */
  sujets: string[]
  description?: string
  /** Identifiants des formateurs affectés au module. */
  formateurs?: number[]
  /** Nouvelle image de couverture du module. */
  image?: File | null
  /** Retirer l'image de couverture existante à l'édition. */
  image_clear?: boolean
}

/** Convertit un payload en multipart pour transmettre l'image. */
function toFormData(payload: Partial<ModulePayload>): FormData {
  const { image, sujets, formateurs, ...textFields } = payload
  const formData = new FormData()

  Object.entries(textFields).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    formData.append(key, String(value))
  })

  // DRF attend une valeur répétée pour les champs de type liste.
  sujets?.forEach((sujet) => formData.append('sujets', sujet))
  formateurs?.forEach((id) => formData.append('formateurs', String(id)))

  if (image) formData.append('image', image)
  if (payload.image_clear) formData.append('image_clear', 'true')

  return formData
}

/** Utilise multipart uniquement quand un fichier ou un retrait est demandé. */
function requiresMultipart(payload: Partial<ModulePayload>): boolean {
  return Boolean(payload.image || payload.image_clear)
}

export const modulesApi = {
  async list(): Promise<ModuleFormation[]> {
    const { data } = await api.get<Paginated<ModuleFormation> | ModuleFormation[]>(
      'formation/modules/',
    )
    return unwrap(data)
  },

  async create(payload: ModulePayload): Promise<ModuleFormation> {
    const body = requiresMultipart(payload) ? toFormData(payload) : payload
    const { data } = await api.post<ModuleFormation>(
      'formation/modules/',
      body,
      requiresMultipart(payload)
        ? { headers: { 'Content-Type': undefined } }
        : undefined,
    )
    return data
  },

  async update(
    id: number,
    payload: Partial<ModulePayload>,
  ): Promise<ModuleFormation> {
    const body = requiresMultipart(payload) ? toFormData(payload) : payload
    const { data } = await api.patch<ModuleFormation>(
      `formation/modules/${id}/`,
      body,
      requiresMultipart(payload)
        ? { headers: { 'Content-Type': undefined } }
        : undefined,
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`formation/modules/${id}/`)
  },
}
