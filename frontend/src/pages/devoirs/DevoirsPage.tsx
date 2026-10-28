import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { devoirsApi, type DevoirPayload } from '@/api/devoirs'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { DevoirsSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { Devoir } from '@/types'
import { DevoirFormDialog } from './DevoirFormDialog'

export function DevoirsPage() {
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
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
    }
  }

  function confirmDelete(devoir: Devoir) {
    confirmDialog({
      header: 'Supprimer le devoir',
      message: `Voulez-vous vraiment supprimer « ${devoir.title} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(devoir.id),
    })
  }

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Pédagogie"
        title="Devoirs"
        subtitle="Retrouvez les travaux envoyés par les formateurs, leurs consignes et les échéances à respecter."
        actions={
          isAdmin ? (
            <Button
              label="Ajouter un devoir"
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

      {devoirs.length === 0 ? (
        <EmptyState
          icon="pi pi-file-edit"
          title="Aucun devoir pour le moment"
          description={
            isAdmin
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

                  {isAdmin && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        label="Modifier"
                        icon="pi pi-pencil"
                        size="small"
                        outlined
                        severity="info"
                        onClick={() => {
                          setEditing(devoir)
                          setDialogVisible(true)
                        }}
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

      <DevoirFormDialog
        visible={dialogVisible}
        devoir={editing}
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
