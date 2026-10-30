import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type {
  MaPresence,
  Paginated,
  ParticipantPresence,
  SeancePresence,
} from '@/types'

export interface ScanResult extends MaPresence {
  deja_enregistre: boolean
}

export const presencesApi = {
  /** Liste des séances d'appel (option Présences). */
  async seances(): Promise<SeancePresence[]> {
    const { data } = await api.get<Paginated<SeancePresence> | SeancePresence[]>(
      'presence/seances/',
    )
    return unwrap(data)
  },

  /** Démarre un nouvel appel : invalide les QR codes précédents. */
  async demarrer(libelle?: string): Promise<SeancePresence> {
    const { data } = await api.post<SeancePresence>('presence/seances/', {
      libelle: libelle ?? '',
    })
    return data
  },

  /** Clôture l'appel en cours (plus aucun scan accepté). */
  async fermer(id: number): Promise<SeancePresence> {
    const { data } = await api.post<SeancePresence>(
      `presence/seances/${id}/fermer/`,
      {},
    )
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`presence/seances/${id}/`)
  },

  /** Présents / absents de la séance demandée. */
  async participants(id: number): Promise<ParticipantPresence[]> {
    const { data } = await api.get<ParticipantPresence[]>(
      `presence/seances/${id}/participants/`,
    )
    return data
  },

  /** Enregistre la présence du stagiaire connecté via le QR code scanné. */
  async scanner(code: string): Promise<ScanResult> {
    const { data } = await api.post<ScanResult>('presence/scan/', { code })
    return data
  },

  /** Statut du jour du stagiaire connecté. */
  async maPresence(): Promise<MaPresence> {
    const { data } = await api.get<MaPresence>('presence/ma-presence/')
    return data
  },
}
