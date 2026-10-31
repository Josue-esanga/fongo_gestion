import api from '@/api/client'
import type { AuthTokens, User } from '@/types'

export const authApi = {
  async login(username: string, password: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('auth/token/', { username, password })
    return data
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('auth/me/')
    return data
  },

  async updateMe(formData: FormData): Promise<User> {
    const { data } = await api.patch<User>('auth/me/', formData, {
      // Laisser le navigateur définir multipart/form-data avec boundary
      headers: { 'Content-Type': undefined },
    })
    return data
  },

  async changePassword(payload: {
    old_password: string
    new_password: string
    confirm_password: string
  }): Promise<{ detail: string }> {
    const { data } = await api.post<{ detail: string }>(
      'auth/change-password/',
      payload,
    )
    return data
  },
}
