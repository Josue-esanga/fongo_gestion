import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { useFormateurs } from '@/hooks/useFormateurs'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { FormateursSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { Icon } from '@/components/Icon'
import { lazyNamed } from '@/lib/lazy'
import type { Formateur, ModuleFormation } from '@/types'

const FormateurFormDialog = lazyNamed(
  () => import('./FormateurFormDialog'),
  'FormateurFormDialog',
)

export function FormateursPage() {
  const { isSuperAdmin } = useAuth()

  const {
    formateurs,
    availableUsers,
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
    deleteFormateur,
    saving,
  } = useFormateurs()

  if (isLoading) return <FormateursSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger les formateurs"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  function confirmDelete(formateur: Formateur) {
    confirmDialog({
      header: 'Supprimer le formateur',
      message: `Retirer « ${formateur.user.full_name} » de la liste des formateurs ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteFormateur(formateur.id),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Pédagogie"
        title="Gestion des formateurs"
        subtitle="Affectez les utilisateurs enregistrés comme formateur aux matières et aux modules enseignés au club."
        actions={
          isSuperAdmin ? (
            <Button
              label="Ajouter un formateur"
              icon="pi pi-plus"
              className="rounded-full px-5"
              onClick={openCreate}
            />
          ) : undefined
        }
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={formateurs}
          dataKey="id"
          paginator
          rows={8}
          rowsPerPageOptions={[8, 16, 32]}
          emptyMessage={
            <EmptyState
              icon="pi pi-id-card"
              title="Aucun formateur"
              description="Nommez un premier formateur pour commencer."
            />
          }
          scrollable
          tableStyle={{ minWidth: '52rem' }}
          className="text-sm"
        >
          <Column
            header="Formateur"
            body={(formateur: Formateur) => (
              <div className="flex items-center gap-3">
                <UserAvatar user={formateur.user} />
                <div>
                  <p className="font-semibold text-slate-900">
                    {formateur.user.full_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formateur.email || "Pas d'email"} · @{formateur.username}
                  </p>
                </div>
              </div>
            )}
          />
          <Column
            header="Matière"
            body={(formateur: Formateur) => (
              <Tag value={formateur.matiere} severity="info" />
            )}
          />
          <Column
            header="Biographie"
            body={(formateur: Formateur) => (
              <p className="max-w-sm text-sm text-slate-600">
                {formateur.bio || 'Aucune biographie disponible'}
              </p>
            )}
          />
          <Column
            header="Modules"
            body={(formateur: Formateur) => {
              if (formateur.modules.length === 0) {
                return <span className="text-sm text-slate-400">Aucun module</span>
              }
              const modulesAffectes = formateur.modules
                .map((id) => modules.find((module) => module.id === id))
                .filter(
                  (module): module is ModuleFormation => module !== undefined,
                )
              if (modulesAffectes.length !== formateur.modules.length) {
                return (
                  <span className="text-sm text-slate-500">
                    {formateur.modules.length} module
                    {formateur.modules.length > 1 ? 's' : ''}
                  </span>
                )
              }
              return (
                <div className="flex flex-wrap gap-1.5">
                  {modulesAffectes.map((module) => (
                    <span
                      key={module.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-fongo-50 px-2.5 py-1 text-xs font-semibold text-fongo-700"
                    >
                      {module.image ? (
                        <img
                          src={module.image}
                          alt="Image du module"
                          width="16"
                          height="16"
                          className="h-4 w-4 rounded object-cover"
                        />
                      ) : (
                        <Icon className="pi pi-book text-[10px]" />
                      )}
                      {module.titre}
                    </span>
                  ))}
                </div>
              )
            }}
          />
          <Column
            header="Statut"
            body={() => <Tag value="Actif" severity="success" />}
          />
          {isSuperAdmin && (
            <Column
              header="Actions"
              frozen
              alignFrozen="right"
              body={(formateur: Formateur) => (
                <div className="flex items-center gap-1">
                  <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    aria-label="Modifier le formateur"
                    onClick={() => openEdit(formateur)}
                  />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    aria-label="Supprimer le formateur"
                    onClick={() => confirmDelete(formateur)}
                  />
                </div>
              )}
            />
          )}
        </DataTable>
      </div>

      <LazyDialogBoundary open={dialogVisible}>
        <FormateurFormDialog
          visible={dialogVisible}
          formateur={editing}
          availableUsers={availableUsers}
          saving={saving}
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
