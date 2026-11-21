import api, { apiDedup, getKey } from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { Devoir, DevoirCible, Paginated } from '@/types'

export interface DevoirPayload {
  title: string
  description: string
  limit_date: string
  /** Public visé : tous les stagiaires, frontend ou backend. */
  cible: DevoirCible
  /** Nouveau document joint (PDF, Word ou image). */
  file?: File | null
  /** Retirer le document joint en édition. */
  file_clear?: boolean
}

/** Convertit le payload en multipart : champs texte + fichier joint. */
function toFormData(payload: DevoirPayload): FormData {
  const { file, ...textFields } = payload
  const formData = new FormData()

  Object.entries(textFields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    formData.append(key, String(value))
  })

  if (file) formData.append('file', file)
  return formData
}

/** Un fichier (ou son retrait) impose multipart/form-data. */
function requiresMultipart(payload: DevoirPayload): boolean {
  return Boolean(payload.file || payload.file_clear)
}

export const devoirsApi = {
  async list(search?: string): Promise<Devoir[]> {
    const key = getKey('devoirs/', search ? { search } : undefined)
    const { data } = await apiDedup(key, () =>
      api.get<Paginated<Devoir> | Devoir[]>('devoirs/', {
        params: search ? { search } : undefined,
      }),
    )
    return unwrap(data)
  },

  async create(payload: DevoirPayload): Promise<Devoir> {
    if (!requiresMultipart(payload)) {
      const { data } = await api.post<Devoir>('devoirs/', payload)
      return data
    }
    const { data } = await api.post<Devoir>('devoirs/', toFormData(payload), {
      // Laisser le navigateur définir multipart/form-data avec boundary
      headers: { 'Content-Type': undefined },
    })
    return data
  },

  async update(id: number, payload: DevoirPayload): Promise<Devoir> {
    if (!requiresMultipart(payload)) {
      const { data } = await api.patch<Devoir>(`devoirs/${id}/`, payload)
      return data
    }
    const { data } = await api.patch<Devoir>(`devoirs/${id}/`, toFormData(payload), {
      // Laisser le navigateur définir multipart/form-data avec boundary
      headers: { 'Content-Type': undefined },
    })
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`devoirs/${id}/`)
  },
}
