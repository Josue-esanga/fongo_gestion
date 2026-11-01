import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { modulesApi, type ModulePayload } from '@/api/modules'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { ModulesSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { subjectIcon } from '@/lib/moduleIcons'
import type { ModuleFormation } from '@/types'
import { ModuleFormDialog } from './ModuleFormDialog'

export function ModulesPage() {
  const { showToast } = useToast()
  // La grille des modules se modifie uniquement depuis le super administrateur.
  const { can } = useAuth()
  const canManage = can('modules')
  const queryClient = useQueryClient()
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
    }
  }

  function confirmDelete(module: ModuleFormation) {
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
          {modules.map((module) => {
            // Les logos connus (HTML5, CSS3, JavaScript, Python, POO, Django…)
            // sont affichés en grand dans la bannière du module.
            const iconSubjects = module.sujets
              .map((sujet) => ({ sujet, icon: subjectIcon(sujet) }))
              .filter(
                (item): item is { sujet: string; icon: string } =>
                  Boolean(item.icon),
              )
              .slice(0, 3)

            return (
              <article
                key={module.id}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-fongo-900 via-[#13177a] to-[#3730a3]">
                  {module.image ? (
                    <>
                      <img
                        src={module.image}
                        alt={module.titre}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-fongo-950/85 via-fongo-950/15 to-fongo-950/55" />
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl"
                        aria-hidden
                      />
                      <div
                        className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-indigo-400/25 blur-2xl"
                        aria-hidden
                      />
                      <div
                        className="absolute inset-0 opacity-[0.08]"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                          backgroundSize: '18px 18px',
                        }}
                        aria-hidden
                      />

                      <div className="relative flex h-full items-center justify-center gap-3 px-4 pt-10">
                        {iconSubjects.length > 0 ? (
                          iconSubjects.map(({ sujet, icon }) => (
                            <span
                              key={sujet}
                              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 p-3 shadow-xl ring-1 ring-white/60 transition duration-300 group-hover:-translate-y-0.5"
                            >
                              <img
                                src={icon}
                                alt={sujet}
                                className="h-full w-full object-contain"
                              />
                            </span>
                          ))
                        ) : (
                          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 text-fongo-700 shadow-xl ring-1 ring-white/60">
                            <i className="pi pi-book text-2xl" />
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  <div className="absolute inset-x-4 top-4 z-10 flex flex-wrap items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-inset ring-white/20 backdrop-blur">
                      <i className="pi pi-book text-[10px]" />
                      Module {module.ordre}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-inset ring-white/20 backdrop-blur">
                      <i className="pi pi-clock text-[10px]" />
                      {module.duree > 0 ? `${module.duree} h` : 'Durée à définir'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-slate-900">
                        {module.titre}
                      </h2>
                      {module.formateurs_detail &&
                        module.formateurs_detail.length > 0 && (
                          <p className="mt-1.5 text-sm font-semibold text-fongo-700">
                            <i className="pi pi-id-card mr-1.5" />
                            {module.formateurs_detail
                              .map((formateur) => formateur.full_name)
                              .join(' · ')}
                          </p>
                        )}
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
                        module.sujets.map((sujet) => (
                          <span
                            key={sujet}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-fongo-500" />
                            {sujet}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">
                          Aucun sujet renseigné.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
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
