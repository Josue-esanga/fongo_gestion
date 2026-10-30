import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { Devoir, Paginated } from '@/types'

export interface DevoirPayload {
  title: string
  description: string
  limit_date: string
}

export const devoirsApi = {
  async list(search?: string): Promise<Devoir[]> {
    const { data } = await api.get<Paginated<Devoir> | Devoir[]>('devoirs/', {
      params: search ? { search } : undefined,
    })
    return unwrap(data)
  },

  async create(payload: DevoirPayload): Promise<Devoir> {
    const { data } = await api.post<Devoir>('devoirs/', payload)
    return data
  },

  async update(id: number, payload: DevoirPayload): Promise<Devoir> {
    const { data } = await api.patch<Devoir>(`devoirs/${id}/`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`devoirs/${id}/`)
  },
}
