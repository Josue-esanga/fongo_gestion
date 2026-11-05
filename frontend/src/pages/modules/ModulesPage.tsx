import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { lazyNamed } from '@/lib/lazy'
import { subjectIcon } from '@/lib/moduleIcons'
import { useModules } from '@/hooks/useModules'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { ModulesSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { Icon } from '@/components/Icon'
import type { ModuleFormation } from '@/types'

const ModuleFormDialog = lazyNamed(
  () => import('./ModuleFormDialog'),
  'ModuleFormDialog',
)

export function ModulesPage() {
  const { can } = useAuth()
  const canManage = can('modules')

  const {
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
    handleSubmit,
    openCreate,
    openEdit,
    deleteModule,
  } = useModules()

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

  function confirmDelete(module: ModuleFormation) {
    confirmDialog({
      header: 'Supprimer le module',
      message: `Voulez-vous vraiment supprimer « ${module.titre} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteModule(module.id),
    })
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
              onClick={openCreate}
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
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-fongo-900 via-fongo-800 to-fongo-700">
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
                        className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-fongo-300/20 blur-2xl"
                        aria-hidden
                      />
                      <div
                        className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-fongo-400/25 blur-2xl"
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
                            <Icon className="pi pi-book text-2xl" />
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  <div className="absolute inset-x-4 top-4 z-10 flex flex-wrap items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-inset ring-white/20 backdrop-blur">
                      <Icon className="pi pi-book text-[10px]" />
                      Module {module.ordre}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white ring-1 ring-inset ring-white/20 backdrop-blur">
                      <Icon className="pi pi-clock text-[10px]" />
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
                            <Icon className="pi pi-id-card mr-1.5" />
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
                          onClick={() => openEdit(module)}
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

      <LazyDialogBoundary open={dialogVisible}>
        <ModuleFormDialog
          visible={dialogVisible}
          module={editing}
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
