import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { lazyNamed } from '@/lib/lazy'
import { usePlanning } from '@/hooks/usePlanning'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { PlanningSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import type { EventItem } from '@/types'

const EventFormDialog = lazyNamed(
  () => import('./EventFormDialog'),
  'EventFormDialog',
)

export function PlanningPage() {
  const { isSuperAdmin } = useAuth()

  const {
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
    handleSubmit,
    openCreate,
    openEdit,
    deleteEvent,
  } = usePlanning()

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

  function confirmDelete(event: EventItem) {
    confirmDialog({
      header: "Supprimer l'événement",
      message: `Voulez-vous vraiment supprimer « ${event.title} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteEvent(event.id),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Vie du club"
        title="Planning"
        subtitle="Organisez les événements et activités du comité FongoLab, et partagez-les avec les membres."
        actions={
          isSuperAdmin ? (
            <Button
              label="Ajouter un événement"
              icon="pi pi-plus"
              className="rounded-full px-5"
              onClick={openCreate}
            />
          ) : undefined
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon="pi pi-calendar"
          title="Aucun événement planifié"
          description={
            isSuperAdmin
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

                {isSuperAdmin && (
                  <div className="flex gap-1">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      severity="info"
                      aria-label="Modifier l'événement"
                      onClick={() => openEdit(event)}
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

      <LazyDialogBoundary open={dialogVisible}>
        <EventFormDialog
          visible={dialogVisible}
          event={editing}
          saving={false}
          onHide={() => {
            setDialogVisible(false)
            setEditing(null)
          }}
          onSubmit={handleSubmit}
        />
      </LazyDialogBoundary>
    </div>
  )
}
