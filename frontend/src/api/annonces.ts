import api, { apiDedup, getKey } from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { Annonce, AnnonceCible, AnnonceTemplate, Paginated } from '@/types'

export interface AnnoncePayload {
  object: string
  contenu: string
  /** Public visé par l'annonce. */
  cible: AnnonceCible
  /** Date et heure prévues, au format ISO 8601. */
  date_prevue: string
  /** Modèle d'affichage (« standard » ou « fongo_expo »). */
  template: AnnonceTemplate
  /** Nouvelle image de la carte avant (modèle FongoExpo). */
  image1?: File | null
  /** Nouvelle image de la carte arrière (modèle FongoExpo). */
  image2?: File | null
  /** Retirer l'image de la carte avant à l'édition. */
  image1_clear?: boolean
  /** Retirer l'image de la carte arrière à l'édition. */
  image2_clear?: boolean
}

/** Convertit le payload en multipart : les champs texte + les images. */
function toFormData(payload: AnnoncePayload): FormData {
  const { image1, image2, ...textFields } = payload
  const formData = new FormData()

  Object.entries(textFields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    formData.append(key, String(value))
  })

  if (image1) formData.append('image1', image1)
  if (image2) formData.append('image2', image2)
  return formData
}

export const annoncesApi = {
  async list(search?: string): Promise<Annonce[]> {
    const key = getKey('annonces/', search ? { search } : undefined)
    const { data } = await apiDedup(key, () =>
      api.get<Paginated<Annonce> | Annonce[]>('annonces/', {
        params: search ? { search } : undefined,
      }),
    )
    return unwrap(data)
  },

  async create(payload: AnnoncePayload): Promise<Annonce> {
    const { data } = await api.post<Annonce>('annonces/', toFormData(payload), {
      // Laisser le navigateur définir multipart/form-data avec boundary
      headers: { 'Content-Type': undefined },
    })
    return data
  },

  async update(id: number, payload: AnnoncePayload): Promise<Annonce> {
    const { data } = await api.patch<Annonce>(`annonces/${id}/`, toFormData(payload), {
      // Laisser le navigateur définir multipart/form-data avec boundary
      headers: { 'Content-Type': undefined },
    })
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`annonces/${id}/`)
  },
}
