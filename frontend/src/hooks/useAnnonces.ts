import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { annoncesApi, type AnnoncePayload } from '@/api/annonces'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, annonceCibleLabel, annonceCibleSeverity, truncateText } from '@/lib/format'
import type { Annonce } from '@/types'

/**
 * Hook dédié à la gestion des annonces.
 * Encapsule : liste des annonces, filtres, création, modification, suppression.
 */
export function useAnnonces() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Annonce | null>(null)

  const { data: annonces = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['annonces'],
      queryFn: () => annoncesApi.list(),
    })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return annonces
    return annonces.filter(
      (annonce) =>
        annonce.object.toLowerCase().includes(term) ||
        annonce.contenu.toLowerCase().includes(term) ||
        annonce.auteur.full_name.toLowerCase().includes(term),
    )
  }, [annonces, search])

  const createMutation = useMutation({
    mutationFn: (payload: AnnoncePayload) => annoncesApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AnnoncePayload }) =>
      annoncesApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => annoncesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['annonces'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Annonce supprimée', "L'annonce a été retirée.")
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  async function handleSubmit(payload: AnnoncePayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Annonce modifiée', "L'annonce a été mise à jour.")
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Annonce publiée', "L'annonce est maintenant visible.")
      }
      await queryClient.invalidateQueries({ queryKey: ['annonces'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
      throw error
    }
  }

  function deleteAnnonce(id: number) {
    deleteMutation.mutate(id)
  }

  return {
    annonces: filtered,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    search,
    setSearch,
    editing,
    setEditing,
    createMutation,
    updateMutation,
    deleteAnnonce,
    handleSubmit,
    saving: createMutation.isPending || updateMutation.isPending,
    // Helpers de formatage pour le template
    formatDateTime,
    annonceCibleLabel,
    annonceCibleSeverity,
    truncateText,
  }
}
