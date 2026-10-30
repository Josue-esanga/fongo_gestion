import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { Formateur, Paginated } from '@/types'

export interface FormateurPayload {
  user_id: number
  matiere: string
  bio: string
}

export const formationApi = {
  async list(search?: string): Promise<Formateur[]> {
    const { data } = await api.get<Paginated<Formateur> | Formateur[]>(
      'formation/formateurs/',
      { params: search ? { search } : undefined },
    )
    return unwrap(data)
  },

  async create(payload: FormateurPayload): Promise<Formateur> {
    const { data } = await api.post<Formateur>('formation/formateurs/', payload)
    return data
  },

  async update(id: number, payload: FormateurPayload): Promise<Formateur> {
    const { data } = await api.patch<Formateur>(
      `formation/formateurs/${id}/`,
      payload,
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`formation/formateurs/${id}/`)
  },
}
