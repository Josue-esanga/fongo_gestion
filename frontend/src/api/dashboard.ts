import api, { apiDedup, getKey } from '@/api/client'
import type { Configuration, DashboardData } from '@/types'

export const dashboardApi = {
  async get(): Promise<DashboardData> {
    const key = getKey('dashboard/')
    const { data } = await apiDedup(key, () =>
      api.get<DashboardData>('dashboard/'),
    )
    return data
  },
}

export const configurationApi = {
  async get(): Promise<Configuration | null> {
    const key = getKey('parametre/configuration/')
    const { data } = await apiDedup(key, () =>
      api.get<
        Configuration[] | { results: Configuration[] }
      >('parametre/configuration/'),
    )
    const list = Array.isArray(data) ? data : data.results
    return list[0] ?? null
  },
}
