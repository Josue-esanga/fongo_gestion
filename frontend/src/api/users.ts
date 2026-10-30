import api from '@/api/client'
import { buildFormData, unwrap } from '@/api/helpers'
import type { Paginated, Role, RoleSupplementaire, User } from '@/types'

export interface UserPayload {
  username: string
  password?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: Role
  /** Rôles supplémentaires d'un admin (super admin uniquement). */
  roles_supplementaires?: RoleSupplementaire[]
  is_active?: boolean
}

/**
 * Les rôles supplémentaires sont envoyés sous forme de chaîne JSON, format
 * attendu par le champ JSONField côté API pour les requêtes multipart.
 */
function toFormData(payload: Partial<UserPayload>, picture?: File | null): FormData {
  const { roles_supplementaires, ...rest } = payload
  const formData = buildFormData(rest as unknown as Record<string, unknown>, picture)
  if (roles_supplementaires !== undefined) {
    formData.append('roles_supplementaires', JSON.stringify(roles_supplementaires))
  }
  return formData
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
    const { data } = await api.post<User>('users/', toFormData(payload, picture))
    return data
  },

  async update(
    id: number,
    payload: Partial<UserPayload>,
    picture?: File | null,
  ): Promise<User> {
    const { data } = await api.patch<User>(
      `users/${id}/`,
      toFormData(payload, picture),
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`users/${id}/`)
  },
}
