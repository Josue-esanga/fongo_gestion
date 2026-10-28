import api from '@/api/client'
import type { Configuration, DashboardData } from '@/types'

export const dashboardApi = {
  async get(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>('dashboard/')
    return data
  },
}

export const configurationApi = {
  async get(): Promise<Configuration | null> {
    const { data } = await api.get<
      Configuration[] | { results: Configuration[] }
    >('parametre/configuration/')
    const list = Array.isArray(data) ? data : data.results
    return list[0] ?? null
  },
}
