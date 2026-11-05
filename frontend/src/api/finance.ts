import api, { apiDedup, getKey } from '@/api/client'
import { unwrap } from '@/api/helpers'
import type {
  CategoriePaiement,
  FinanceOverview,
  ModulePaiement,
  Paginated,
  Paiement,
  StagiaireFinance,
  StatutPaiement,
} from '@/types'

export interface PaiementPayload {
  montant: number
  /** Module de formation ou autre frais (inscription, cotisation…). */
  category: CategoriePaiement
  /** Module payé, uniquement pour la catégorie « module ». */
  module?: number | null
  description: string
  id_stagiaire: number
}

/** Demande de paiement Lumicash déposée par le stagiaire lui-même. */
export interface LumicashPayload {
  montant: number
  /** Module de formation ou autre frais. */
  category: CategoriePaiement
  /** Module payé, uniquement pour la catégorie « module ». */
  module?: number | null
  description?: string
}

export const financeApi = {
  /**
   * Modules proposés dans les formulaires de paiement : ouvert à tous les
   * profils authentifiés (y compris les stagiaires).
   */
  async modulesPaiement(): Promise<ModulePaiement[]> {
    const key = getKey('finance/paiements/modules/')
    const { data } = await apiDedup(key, () =>
      api.get<ModulePaiement[]>('finance/paiements/modules/'),
    )
    return data
  },

  async payments(params?: { search?: string; category?: string }): Promise<Paiement[]> {
    const key = getKey('finance/paiements/', params)
    const { data } = await apiDedup(key, () =>
      api.get<Paginated<Paiement> | Paiement[]>(
        'finance/paiements/',
        { params },
      ),
    )
    return unwrap(data)
  },

  async createPayment(payload: PaiementPayload): Promise<Paiement> {
    const { data } = await api.post<Paiement>('finance/paiements/', payload)
    return data
  },

  async updatePayment(id: number, payload: PaiementPayload): Promise<Paiement> {
    const { data } = await api.patch<Paiement>(`finance/paiements/${id}/`, payload)
    return data
  },

  /** Valide ou refuse une demande (réservé au caissier / super admin). */
  async setStatut(id: number, statut: StatutPaiement): Promise<Paiement> {
    const { data } = await api.patch<Paiement>(`finance/paiements/${id}/`, { statut })
    return data
  },

  /**
   * Déclare un paiement effectué sur le numéro Lumicash du club : la demande
   * est créée « en attente » puis validée par un caissier.
   */
  async lumicash(payload: LumicashPayload): Promise<Paiement> {
    const { data } = await api.post<Paiement>('finance/paiements/lumicash/', payload)
    return data
  },

  async removePayment(id: number): Promise<void> {
    await api.delete(`finance/paiements/${id}/`)
  },

  async students(): Promise<StagiaireFinance[]> {
    const key = getKey('finance/students/')
    const { data } = await apiDedup(key, () =>
      api.get<StagiaireFinance[] | Paginated<StagiaireFinance>>(
        'finance/students/',
      ),
    )
    return unwrap(data)
  },

  async overview(): Promise<FinanceOverview> {
    const key = getKey('finance/overview/')
    const { data } = await apiDedup(key, () =>
      api.get<FinanceOverview>('finance/overview/'),
    )
    return data
  },
}
