import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { ModulePedagogique, Paginated } from '@/types'

export interface ModulePedagogiquePayload {
  ordre: number
  titre: string
  /** Liste des sujets abordés dans le module. */
  sujets: string[]
  description?: string
}

export const modulesApi = {
  async list(): Promise<ModulePedagogique[]> {
    const { data } = await api.get<Paginated<ModulePedagogique> | ModulePedagogique[]>(
      'formation/programme/',
    )
    return unwrap(data)
  },

  async create(payload: ModulePedagogiquePayload): Promise<ModulePedagogique> {
    const { data } = await api.post<ModulePedagogique>(
      'formation/programme/',
      payload,
    )
    return data
  },

  async update(
    id: number,
    payload: Partial<ModulePedagogiquePayload>,
  ): Promise<ModulePedagogique> {
    const { data } = await api.patch<ModulePedagogique>(
      `formation/programme/${id}/`,
      payload,
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`formation/programme/${id}/`)
  },
}
