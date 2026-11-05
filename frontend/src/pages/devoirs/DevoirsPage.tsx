import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import { lazyNamed } from '@/lib/lazy'
import { useDevoirs } from '@/hooks/useDevoirs'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { DevoirsSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import type { Devoir } from '@/types'

const DevoirFormDialog = lazyNamed(
  () => import('./DevoirFormDialog'),
  'DevoirFormDialog',
)

export function DevoirsPage() {
  const { can } = useAuth()
  const canEditDevoirs = can('devoirs')

  const {
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
    handleSubmit,
    openCreate,
    openEdit,
    deleteDevoir,
  } = useDevoirs()

  if (isLoading) return <DevoirsSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger les devoirs"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  function confirmDelete(devoir: Devoir) {
    confirmDialog({
      header: 'Supprimer le devoir',
      message: `Voulez-vous vraiment supprimer « ${devoir.title} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteDevoir(devoir.id),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Pédagogie"
        title="Devoirs"
        subtitle="Retrouvez les travaux envoyés par les formateurs, leurs consignes et les échéances à respecter."
        actions={
          canEditDevoirs ? (
            <Button
              label="Ajouter un devoir"
              icon="pi pi-plus"
              className="rounded-full px-5"
              onClick={openCreate}
            />
          ) : undefined
        }
      />

      {devoirs.length === 0 ? (
        <EmptyState
          icon="pi pi-file-edit"
          title="Aucun devoir pour le moment"
          description={
            canEditDevoirs
              ? 'Publiez un premier devoir pour vos stagiaires.'
              : "Aucun devoir n'a encore été publié par un formateur."
          }
        />
      ) : (
        <div className="space-y-4">
          {devoirs.map((devoir) => (
            <article
              key={devoir.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Tag
                      value={devoir.is_expired ? 'Échéance dépassée' : 'En cours'}
                      severity={devoir.is_expired ? 'danger' : 'success'}
                    />
                    <span className="text-xs text-slate-500">
                      Publié le {formatDateTime(devoir.created_at)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{devoir.title}</h2>
                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-600">
                    {devoir.description}
                  </p>
                </div>

                <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:w-72">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Échéance
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDateTime(devoir.limit_date)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {devoir.is_expired
                      ? "La date limite est dépassée. Contactez votre formateur si nécessaire."
                      : 'Le travail doit être rendu avant cette date.'}
                  </p>

                  {canEditDevoirs && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        label="Modifier"
                        icon="pi pi-pencil"
                        size="small"
                        outlined
                        severity="info"
                        onClick={() => openEdit(devoir)}
                      />
                      <Button
                        label="Supprimer"
                        icon="pi pi-trash"
                        size="small"
                        outlined
                        severity="danger"
                        onClick={() => confirmDelete(devoir)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <LazyDialogBoundary open={dialogVisible}>
        <DevoirFormDialog
          visible={dialogVisible}
          devoir={editing}
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
