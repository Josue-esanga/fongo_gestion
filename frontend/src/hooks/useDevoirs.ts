import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { devoirsApi, type DevoirPayload } from '@/api/devoirs'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { Devoir } from '@/types'

/**
 * Hook dédié à la gestion des devoirs.
 * Encapsule : liste, création, modification, suppression.
 */
export function useDevoirs() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<Devoir | null>(null)

  const { data: devoirs = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['devoirs'],
      queryFn: () => devoirsApi.list(),
    })

  const createMutation = useMutation({
    mutationFn: (payload: DevoirPayload) => devoirsApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DevoirPayload }) =>
      devoirsApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => devoirsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devoirs'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Devoir supprimé', "Le devoir a été retiré de la liste.")
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  async function handleSubmit(payload: DevoirPayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Devoir modifié', 'Les consignes ont été mises à jour.')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Devoir publié', 'Le devoir est maintenant visible.')
      }
      await queryClient.invalidateQueries({ queryKey: ['devoirs'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
      throw error
    }
  }

  function deleteDevoir(id: number) {
    deleteMutation.mutate(id)
  }

  function openCreate() {
    setEditing(null)
    setDialogVisible(true)
  }

  function openEdit(devoir: Devoir) {
    setEditing(devoir)
    setDialogVisible(true)
  }

  return {
    devoirs,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dialogVisible,
    setDialogVisible,
    editing,
    setEditing,
    createMutation,
    updateMutation,
    deleteDevoir,
    openCreate,
    openEdit,
    handleSubmit,
    formatDateTime,
  }
}
