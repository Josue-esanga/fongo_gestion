import api, { apiDedup, getKey } from '@/api/client'
import { unwrap } from '@/api/helpers'
import type { AuditLog, AuditLogFilters, AuditSummary, Paginated } from '@/types'

export const auditApi = {
  /** Journal d'activité filtré (lecture seule, super admin). */
  async list(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    const key = getKey('audit/logs/', filters as Record<string, unknown>)
    const { data } = await apiDedup(key, () =>
      api.get<Paginated<AuditLog>>('audit/logs/', { params: filters }),
    )
    return unwrap(data)
  },

  /** Statistiques de la page d'audit (totaux, activité, contributeurs). */
  async summary(): Promise<AuditSummary> {
    const key = getKey('audit/summary/')
    const { data } = await apiDedup(key, () => api.get<AuditSummary>('audit/summary/'))
    return data
  },
}
