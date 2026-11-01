import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { formationApi, type FormateurPayload } from '@/api/formation'
import { modulesApi } from '@/api/modules'
import { usersApi } from '@/api/users'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { FormateursSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import type { Formateur, ModuleFormation, User } from '@/types'
import { FormateurFormDialog } from './FormateurFormDialog'

/**
 * Un utilisateur est proposable comme formateur s'il porte le rôle
 * supplémentaire « formateur » (le super admin possède tous les rôles).
 */
function isFormateurCandidate(user: User): boolean {
  if (user.role === 'stagiaire') return false
  if (user.role === 'super_admin' || user.is_superuser) return true
  return (user.roles_supplementaires ?? []).includes('formateur')
}

export function FormateursPage() {
  const { showToast } = useToast()
  // L'écriture reste réservée au super administrateur.
  const { isSuperAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<Formateur | null>(null)

  const formateursQuery = useQuery({
    queryKey: ['formateurs'],
    queryFn: () => formationApi.list(),
  })

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  })

  // Grille pédagogique : utilisée pour l'assignation et l'affichage.
  const modulesQuery = useQuery({
    queryKey: ['modules-programme'],
    queryFn: () => modulesApi.list(),
  })

  const formateurs = formateursQuery.data ?? []
  const users = usersQuery.data ?? []
  const modules = modulesQuery.data ?? []

  const availableUsers = useMemo(() => {
    const assignedIds = new Set(
      formateurs
        .filter((item) => item.id !== editing?.id)
        .map((item) => item.user.id),
    )
    return users.filter(
      (user) => isFormateurCandidate(user) && !assignedIds.has(user.id),
    )
  }, [editing?.id, formateurs, users])

  const createMutation = useMutation({
    mutationFn: (payload: FormateurPayload) => formationApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormateurPayload }) =>
      formationApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => formationApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['formateurs'] })
      showToast('success', 'Formateur retiré', 'Le formateur a été supprimé.')
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  async function handleSubmit(payload: FormateurPayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Formateur modifié', 'Les informations ont été mises à jour.')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Formateur nommé', 'Le formateur a été assigné.')
      }
      await queryClient.invalidateQueries({ queryKey: ['formateurs'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
    }
  }

  function confirmDelete(formateur: Formateur) {
    confirmDialog({
      header: 'Supprimer le formateur',
      message: `Retirer « ${formateur.user.full_name} » de la liste des formateurs ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(formateur.id),
    })
  }

  if (formateursQuery.isLoading || usersQuery.isLoading) {
    return <FormateursSkeleton />
  }

  if (formateursQuery.isError || usersQuery.isError) {
    const queryError = formateursQuery.error ?? usersQuery.error
    return (
      <ErrorState
        title="Impossible de charger les formateurs"
        description={getErrorMessage(queryError)}
        onRetry={() => {
          void formateursQuery.refetch()
          void usersQuery.refetch()
        }}
        retrying={formateursQuery.isFetching || usersQuery.isFetching}
      />
    )
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
              onClick={() => {
                setEditing(null)
                setDialogVisible(true)
              }}
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
                // Grille indisponible : on retombe sur le compteur.
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                    >
                      {module.image ? (
                        <img
                          src={module.image}
                          alt=""
                          className="h-4 w-4 rounded object-cover"
                        />
                      ) : (
                        <i className="pi pi-book text-[10px]" />
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
                    onClick={() => {
                      setEditing(formateur)
                      setDialogVisible(true)
                    }}
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

      <FormateurFormDialog
        visible={dialogVisible}
        formateur={editing}
        availableUsers={availableUsers}
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
