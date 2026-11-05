import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardData } from '@/types'

/**
 * Hook dédié au tableau de bord.
 * Encapsule toute la logique de récupération des données du dashboard.
 *
 * Retourne les données du dashboard, l'état de chargement, l'erreur et la
 * fonction de rechargement.
 */
export function useDashboard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

  return {
    data: data as DashboardData | undefined,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  }
}
