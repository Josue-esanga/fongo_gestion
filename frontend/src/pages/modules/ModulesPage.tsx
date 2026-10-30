import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { modulesApi, type ModulePedagogiquePayload } from '@/api/modules'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { ModulesSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { subjectIcon } from '@/lib/moduleIcons'
import type { ModulePedagogique } from '@/types'
import { ModuleFormDialog } from './ModuleFormDialog'

export function ModulesPage() {
  const { showToast } = useToast()
  // La grille des modules se modifie uniquement depuis le super administrateur.
  const { can } = useAuth()
  const canManage = can('modules')
  const queryClient = useQueryClient()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<ModulePedagogique | null>(null)

  const { data: modules = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['modules-programme'],
      queryFn: () => modulesApi.list(),
    })

  const createMutation = useMutation({
    mutationFn: (payload: ModulePedagogiquePayload) => modulesApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ModulePedagogiquePayload
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

  async function handleSubmit(payload: ModulePedagogiquePayload) {
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
    }
  }

  function confirmDelete(module: ModulePedagogique) {
    confirmDialog({
      header: 'Supprimer le module',
      message: `Voulez-vous vraiment supprimer « ${module.titre} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(module.id),
    })
  }

  if (isLoading) return <ModulesSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger les modules"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Programme"
        title="Modules"
        subtitle="La grille pédagogique du club : les modules proposés et les sujets abordés dans chacun d'eux."
        actions={
          canManage ? (
            <Button
              label="Ajouter un module"
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

      {modules.length === 0 ? (
        <EmptyState
          icon="pi pi-book"
          title="Aucun module pour le moment"
          description={
            canManage
              ? 'Ajoutez un premier module pour présenter le programme de formation.'
              : 'Le programme de formation n’a pas encore été publié.'
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {modules.map((module) => (
            <article
              key={module.id}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full bg-fongo-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-fongo-900">
                    <i className="pi pi-book" />
                    Module {module.ordre}
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    {module.titre}
                  </h2>
                </div>

                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      severity="info"
                      aria-label={`Modifier ${module.titre}`}
                      onClick={() => {
                        setEditing(module)
                        setDialogVisible(true)
                      }}
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      aria-label={`Supprimer ${module.titre}`}
                      onClick={() => confirmDelete(module)}
                    />
                  </div>
                )}
              </div>

              {module.description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {module.description}
                </p>
              )}

              <div className="mt-5 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Sujets abordés
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {module.sujets.length > 0 ? (
                    module.sujets.map((sujet) => {
                      const icon = subjectIcon(sujet)
                      return (
                        <span
                          key={sujet}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm"
                        >
                          {icon ? (
                            <img
                              src={icon}
                              alt=""
                              aria-hidden
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <i className="pi pi-code text-fongo-500" />
                          )}
                          {sujet}
                        </span>
                      )
                    })
                  ) : (
                    <span className="text-sm text-slate-400">Aucun sujet renseigné.</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ModuleFormDialog
        visible={dialogVisible}
        module={editing}
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
