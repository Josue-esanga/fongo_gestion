import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { eventsApi, type EventPayload } from '@/api/events'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { PlanningSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { EventItem } from '@/types'
import { EventFormDialog } from './EventFormDialog'

export function PlanningPage() {
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
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
    }
  }

  function confirmDelete(event: EventItem) {
    confirmDialog({
      header: "Supprimer l'événement",
      message: `Voulez-vous vraiment supprimer « ${event.title} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(event.id),
    })
  }

  if (isLoading) return <PlanningSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger le planning"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Vie du club"
        title="Planning"
        subtitle="Organisez les événements et activités du comité FongoLab, et partagez-les avec les membres."
        actions={
          isAdmin ? (
            <Button
              label="Ajouter un événement"
              icon="pi pi-plus"
              className="rounded-full px-5"
              onClick={() => {
                setEditing(null)
                setDialogVisible(true)
              }}
            />
          ) : undefined
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon="pi pi-calendar"
          title="Aucun événement planifié"
          description={
            isAdmin
              ? 'Ajoutez un premier événement au calendrier du club.'
              : 'Le calendrier du club est vide pour le moment.'
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-fongo-50 text-fongo-900">
                  <span className="text-lg font-extrabold leading-none">
                    {new Date(event.date).getDate()}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {new Date(event.date).toLocaleDateString('fr-FR', {
                      month: 'short',
                    })}
                  </span>
                </div>
                <Tag
                  value={new Date(event.date) >= new Date() ? 'À venir' : 'Passé'}
                  severity={new Date(event.date) >= new Date() ? 'info' : 'secondary'}
                />
              </div>

              <h2 className="text-lg font-bold text-slate-900">{event.title}</h2>
              <p className="mt-1 text-xs font-medium text-fongo-700">
                {formatDateTime(event.date)}
              </p>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                {event.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <UserAvatar user={event.dirigent} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {event.dirigent.full_name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Organisé le {formatDateTime(event.created_at)}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      severity="info"
                      aria-label="Modifier l'événement"
                      onClick={() => {
                        setEditing(event)
                        setDialogVisible(true)
                      }}
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      aria-label="Supprimer l'événement"
                      onClick={() => confirmDelete(event)}
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <EventFormDialog
        visible={dialogVisible}
        event={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onHide={() => {
          setDialogVisible(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
