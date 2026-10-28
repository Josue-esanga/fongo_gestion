import api from '@/api/client'
import { buildFormData, unwrap } from '@/api/helpers'
import type { Paginated, Role, User } from '@/types'

export interface UserPayload {
  username: string
  password?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: Role
  is_active?: boolean
}

export const usersApi = {
  async list(params?: { role?: Role; search?: string }): Promise<User[]> {
    const { data } = await api.get<Paginated<User> | User[]>('users/', { params })
    return unwrap(data)
  },

  async get(id: number): Promise<User> {
    const { data } = await api.get<User>(`users/${id}/`)
    return data
  },

  async create(payload: UserPayload, picture?: File | null): Promise<User> {
    const formData = buildFormData(payload as unknown as Record<string, unknown>, picture)
    const { data } = await api.post<User>('users/', formData)
    return data
  },

  async update(
    id: number,
    payload: Partial<UserPayload>,
    picture?: File | null,
  ): Promise<User> {
    const formData = buildFormData(payload as unknown as Record<string, unknown>, picture)
    const { data } = await api.patch<User>(`users/${id}/`, formData)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`users/${id}/`)
  },
}
