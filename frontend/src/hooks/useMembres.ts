import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UserPayload } from '@/api/users'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { extraRoleLabel, formatDate, roleLabel } from '@/lib/format'
import type { User } from '@/types'

type Filter = 'all' | 'stagiaire' | 'admin'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'stagiaire', label: 'Stagiaires' },
  { key: 'admin', label: 'Administrateurs' },
]

function roleSeverity(role: User['role']) {
  if (role === 'super_admin') return 'warning'
  if (role === 'admin') return 'info'
  return 'success'
}

/**
 * Hook dédié à la gestion des membres (utilisateurs).
 * Encapsule : liste, filtres, recherche, création, modification, suppression.
 */
export function useMembres() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const { data: users = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['users'],
      queryFn: () => usersApi.list(),
    })

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditing(null)
      setDialogVisible(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filteredUsers = useMemo(() => {
    if (filter === 'all') return users
    if (filter === 'admin') {
      return users.filter((user) => user.role === 'admin' || user.role === 'super_admin')
    }
    return users.filter((user) => user.role === 'stagiaire')
  }, [filter, users])

  const counts = useMemo(
    () => ({
      all: users.length,
      stagiaire: users.filter((user) => user.role === 'stagiaire').length,
      admin: users.filter(
        (user) => user.role === 'admin' || user.role === 'super_admin',
      ).length,
    }),
    [users],
  )

  const createMutation = useMutation({
    mutationFn: ({
      payload,
      picture,
    }: {
      payload: UserPayload
      picture: File | null
    }) => usersApi.create(payload, picture),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
      picture,
    }: {
      id: number
      payload: UserPayload
      picture: File | null
    }) => usersApi.update(id, payload, picture),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Membre supprimé', 'Le compte a été supprimé avec succès.')
    },
    onError: (error) => {
      showToast('error', 'Suppression impossible', getErrorMessage(error))
    },
  })

  async function handleSubmit(payload: UserPayload, picture: File | null) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload, picture })
        showToast('success', 'Membre modifié', 'Les informations ont été mises à jour.')
      } else {
        await createMutation.mutateAsync({ payload, picture })
        showToast('success', 'Membre ajouté', 'Le nouveau compte a été créé.')
      }
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
      throw error
    }
  }

  function openCreate() {
    setEditing(null)
    setDialogVisible(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setDialogVisible(true)
  }

  function deleteUser(id: number) {
    deleteMutation.mutate(id)
  }

  return {
    // Données
    users: filteredUsers,
    allUsers: users,
    counts,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    // État UI
    filter,
    setFilter,
    search,
    setSearch,
    dialogVisible,
    setDialogVisible,
    editing,
    setEditing,
    // Actions
    handleSubmit,
    openCreate,
    openEdit,
    deleteUser,
    deleteMutation,
    createMutation,
    updateMutation,
    // Helpers d'affichage
    FILTERS,
    roleSeverity,
    roleLabel,
    extraRoleLabel,
    formatDate,
  }
}
