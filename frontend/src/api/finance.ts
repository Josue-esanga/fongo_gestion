import api from '@/api/client'
import { unwrap } from '@/api/helpers'
import type {
  CategoriePaiement,
  FinanceOverview,
  Paginated,
  Paiement,
  StagiaireFinance,
} from '@/types'

export interface PaiementPayload {
  montant: number
  category: CategoriePaiement
  description: string
  id_stagiaire: number
}

export const financeApi = {
  async payments(params?: { search?: string; category?: string }): Promise<Paiement[]> {
    const { data } = await api.get<Paginated<Paiement> | Paiement[]>(
      'finance/paiements/',
      { params },
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

  async removePayment(id: number): Promise<void> {
    await api.delete(`finance/paiements/${id}/`)
  },

  async students(): Promise<StagiaireFinance[]> {
    const { data } = await api.get<StagiaireFinance[] | Paginated<StagiaireFinance>>(
      'finance/students/',
    )
    return unwrap(data)
  },

  async overview(): Promise<FinanceOverview> {
    const { data } = await api.get<FinanceOverview>('finance/overview/')
    return data
  },
}
