import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit'
import type { AuditAction, AuditLog, AuditLogFilters } from '@/types'

/**
 * Hook dédié à la page d'audit (super administrateur).
 *
 * Encapsule : journal paginé côté serveur, recherche « qui a fait quoi »
 * (debouncée), filtres par action et par ressource, statistiques et entrée
 * sélectionnée pour l'affichage du détail.
 */
export function useAudit() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [modelLabel, setModelLabel] = useState('')
  const [selected, setSelected] = useState<AuditLog | null>(null)

  // Recherche côté API : on attend 300 ms de silence avant de recharger.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const filters = useMemo<AuditLogFilters>(
    () => ({
      ...(search ? { search } : {}),
      ...(action ? { action } : {}),
      ...(modelLabel ? { model_label: modelLabel } : {}),
      page_size: 200,
    }),
    [search, action, modelLabel],
  )

  const logsQuery = useQuery({
    queryKey: ['audit', 'logs', filters],
    queryFn: () => auditApi.list(filters),
    // Conserve la page affichée pendant le rechargement : pas de clignotement.
    placeholderData: keepPreviousData,
  })

  const summaryQuery = useQuery({
    queryKey: ['audit', 'summary'],
    queryFn: auditApi.summary,
    staleTime: 60_000,
  })

  const summary = summaryQuery.data
  const modelOptions = useMemo(
    () =>
      (summary?.tracked_models ?? []).map((model) => ({
        label: model.name,
        value: model.label,
      })),
    [summary],
  )

  const hasFilters = Boolean(search || action || modelLabel)

  function resetFilters() {
    setSearchInput('')
    setSearch('')
    setAction('')
    setModelLabel('')
  }

  return {
    // Données
    logs: logsQuery.data ?? [],
    summary,
    isLoading: logsQuery.isLoading,
    isError: logsQuery.isError,
    error: logsQuery.error,
    refetch: logsQuery.refetch,
    isFetching: logsQuery.isFetching,
    // Filtres
    searchInput,
    setSearchInput,
    action,
    setAction,
    modelLabel,
    setModelLabel,
    modelOptions,
    hasFilters,
    resetFilters,
    // Détail
    selected,
    setSelected,
  }
}
