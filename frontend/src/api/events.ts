import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { EventItem, Paginated } from '@/types'

export interface EventPayload {
  title: string
  description: string
  date: string
}

export const eventsApi = {
  async list(search?: string): Promise<EventItem[]> {
    const { data } = await api.get<Paginated<EventItem> | EventItem[]>(
      'planning/events/',
      { params: search ? { search } : undefined },
    )
    return unwrap(data)
  },

  async create(payload: EventPayload): Promise<EventItem> {
    const { data } = await api.post<EventItem>('planning/events/', payload)
    return data
  },

  async update(id: number, payload: EventPayload): Promise<EventItem> {
    const { data } = await api.patch<EventItem>(`planning/events/${id}/`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`planning/events/${id}/`)
  },
}
