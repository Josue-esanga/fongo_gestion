import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { modulesApi, type ModulePayload } from '@/api/modules'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import type { ModuleFormation } from '@/types'

/**
 * Hook dédié à la gestion des modules pédagogiques.
 * Encapsule : liste, création, modification, suppression.
 */
export function useModules() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<ModuleFormation | null>(null)

  const { data: modules = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['modules-programme'],
      queryFn: () => modulesApi.list(),
    })

  const createMutation = useMutation({
    mutationFn: (payload: ModulePayload) => modulesApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: Partial<ModulePayload>
    }) => modulesApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => modulesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['modules-programme'] })
      showToast('success', 'Module supprimé', 'Le module a été retiré de la grille.')
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  async function handleSubmit(payload: ModulePayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Module modifié', 'Les informations ont été mises à jour.')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Module ajouté', 'Le module est maintenant visible.')
      }
      await queryClient.invalidateQueries({ queryKey: ['modules-programme'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (err) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(err))
      throw err
    }
  }

  function deleteModule(id: number) {
    deleteMutation.mutate(id)
  }

  function openCreate() {
    setEditing(null)
    setDialogVisible(true)
  }

  function openEdit(module: ModuleFormation) {
    setEditing(module)
    setDialogVisible(true)
  }

  return {
    modules,
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
    deleteModule,
    openCreate,
    openEdit,
    handleSubmit,
  }
}
