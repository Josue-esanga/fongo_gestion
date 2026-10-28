import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { Annonce, Paginated } from '@/types'

export interface AnnoncePayload {
  object: string
  contenu: string
}

export const annoncesApi = {
  async list(search?: string): Promise<Annonce[]> {
    const { data } = await api.get<Paginated<Annonce> | Annonce[]>('annonces/', {
      params: search ? { search } : undefined,
    })
    return unwrap(data)
  },

  async create(payload: AnnoncePayload): Promise<Annonce> {
    const { data } = await api.post<Annonce>('annonces/', payload)
    return data
  },

  async update(id: number, payload: AnnoncePayload): Promise<Annonce> {
    const { data } = await api.patch<Annonce>(`annonces/${id}/`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`annonces/${id}/`)
  },
}
