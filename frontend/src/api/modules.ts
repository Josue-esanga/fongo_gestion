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
}

export const modulesApi = {
  async list(): Promise<ModuleFormation[]> {
    const { data } = await api.get<Paginated<ModuleFormation> | ModuleFormation[]>(
      'formation/modules/',
    )
    return unwrap(data)
  },

  async create(payload: ModulePayload): Promise<ModuleFormation> {
    const { data } = await api.post<ModuleFormation>(
      'formation/modules/',
      payload,
    )
    return data
  },

  async update(
    id: number,
    payload: Partial<ModulePayload>,
  ): Promise<ModuleFormation> {
    const { data } = await api.patch<ModuleFormation>(
      `formation/modules/${id}/`,
      payload,
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`formation/modules/${id}/`)
  },
}
