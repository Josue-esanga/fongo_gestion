import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventsApi, type EventPayload } from '@/api/events'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { EventItem } from '@/types'

/**
 * Hook dédié à la gestion du planning (événements).
 * Encapsule : liste, création, modification, suppression.
 */
export function usePlanning() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)

  const { data: events = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['events'],
      queryFn: () => eventsApi.list(),
    })

  const createMutation = useMutation({
    mutationFn: (payload: EventPayload) => eventsApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EventPayload }) =>
      eventsApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => eventsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Événement supprimé', "L'événement a été retiré du planning.")
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  async function handleSubmit(payload: EventPayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Événement modifié', "L'événement a été mis à jour.")
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Événement ajouté', "L'événement est maintenant planifié.")
      }
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
      throw error
    }
  }

  function deleteEvent(id: number) {
    deleteMutation.mutate(id)
  }

  function openCreate() {
    setEditing(null)
    setDialogVisible(true)
  }

  function openEdit(event: EventItem) {
    setEditing(event)
    setDialogVisible(true)
  }

  return {
    events,
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
    deleteEvent,
    openCreate,
    openEdit,
    handleSubmit,
    formatDateTime,
  }
}
