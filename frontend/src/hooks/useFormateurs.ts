import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formationApi, type FormateurPayload } from '@/api/formation'
import { modulesApi } from '@/api/modules'
import { usersApi } from '@/api/users'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import type { Formateur, User } from '@/types'

/**
 * Un utilisateur est proposable comme formateur s'il porte le rôle
 * supplémentaire « formateur » (le super admin possède tous les rôles).
 */
function isFormateurCandidate(user: User): boolean {
  if (user.role === 'stagiaire') return false
  if (user.role === 'super_admin' || user.is_superuser) return true
  return (user.roles_supplementaires ?? []).includes('formateur')
}

/**
 * Hook dédié à la gestion des formateurs.
 * Encapsule : liste des formateurs, utilisateurs disponibles, modules,
 * création, modification, suppression.
 */
export function useFormateurs() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<Formateur | null>(null)

  const formateursQuery = useQuery({
    queryKey: ['formateurs'],
    queryFn: () => formationApi.list(),
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  })

  const modulesQuery = useQuery({
    queryKey: ['modules-programme'],
    queryFn: () => modulesApi.list(),
  })

  const formateurs = formateursQuery.data ?? []
  const users = usersQuery.data ?? []
  const modules = modulesQuery.data ?? []

  const availableUsers = useMemo(() => {
    const assignedIds = new Set(
      formateurs
        .filter((item) => item.id !== editing?.id)
        .map((item) => item.user.id),
    )
    return users.filter(
      (user) => isFormateurCandidate(user) && !assignedIds.has(user.id),
    )
  }, [editing?.id, formateurs, users])

  const createMutation = useMutation({
    mutationFn: (payload: FormateurPayload) => formationApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormateurPayload }) =>
      formationApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => formationApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['formateurs'] })
      showToast('success', 'Formateur retiré', 'Le formateur a été supprimé.')
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  async function handleSubmit(payload: FormateurPayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Formateur modifié', 'Les informations ont été mises à jour.')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Formateur nommé', 'Le formateur a été assigné.')
      }
      await queryClient.invalidateQueries({ queryKey: ['formateurs'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
      throw error
    }
  }

  function deleteFormateur(id: number) {
    deleteMutation.mutate(id)
  }

  function openCreate() {
    setEditing(null)
    setDialogVisible(true)
  }

  function openEdit(formateur: Formateur) {
    setEditing(formateur)
    setDialogVisible(true)
  }

  return {
    formateurs,
    users,
    modules,
    availableUsers,
    isLoading:
      formateursQuery.isLoading || usersQuery.isLoading || modulesQuery.isLoading,
    isError: formateursQuery.isError || usersQuery.isError,
    error: formateursQuery.error ?? usersQuery.error,
    refetch: () => {
      void formateursQuery.refetch()
      void usersQuery.refetch()
      void modulesQuery.refetch()
    },
    isFetching:
      formateursQuery.isFetching || usersQuery.isFetching || modulesQuery.isFetching,
    dialogVisible,
    setDialogVisible,
    editing,
    setEditing,
    createMutation,
    updateMutation,
    deleteFormateur,
    saving: createMutation.isPending || updateMutation.isPending,
    openCreate,
    openEdit,
    handleSubmit,
    isFormateurCandidate,
  }
}
