import { useEffect } from 'react'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InputText } from 'primereact/inputtext'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { useMembres } from '@/hooks/useMembres'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { MembersSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { Icon } from '@/components/Icon'
import { lazyNamed } from '@/lib/lazy'
import type { User } from '@/types'

const MemberFormDialog = lazyNamed(
  () => import('./MemberFormDialog'),
  'MemberFormDialog',
)

export function MembersPage() {
  const { isSuperAdmin } = useAuth()

  const {
    users: filteredUsers,
    counts,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    filter,
    setFilter,
    search,
    setSearch,
    dialogVisible,
    setDialogVisible,
    editing,
    setEditing,
    handleSubmit,
    openCreate,
    openEdit,
    deleteUser,
    deleteMutation,
    FILTERS,
    roleSeverity,
    roleLabel,
    extraRoleLabel,
    formatDate,
  } = useMembres()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'create') {
      setEditing(null)
      setDialogVisible(true)
    }
  }, [])

  if (isLoading) return <MembersSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger les membres"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  function confirmDelete(user: User) {
    confirmDialog({
      header: 'Supprimer le membre',
      message: `Voulez-vous vraiment supprimer « ${user.username} » ? Cette action est irréversible.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteUser(user.id),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des membres"
        subtitle={
          isSuperAdmin
            ? "Créez, filtrez et mettez à jour les comptes des stagiaires et administrateurs du club."
            : "Consultez les comptes des stagiaires et administrateurs du club."
        }
        actions={
          isSuperAdmin ? (
            <Button
              label="Ajouter un utilisateur"
              icon="pi pi-plus"
              onClick={openCreate}
              className="rounded-full px-5"
            />
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button type="button"
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item.key
                  ? 'bg-fongo-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                  filter === item.key ? 'bg-white/20' : 'bg-white'
                }`}
              >
                {counts[item.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Icon className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <InputText
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un membre…"
            className="w-full pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={filteredUsers}
          dataKey="id"
          paginator
          rows={8}
          rowsPerPageOptions={[8, 16, 32]}
          globalFilter={search}
          globalFilterFields={[
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
          ]}
          emptyMessage={
            <EmptyState
              icon="pi pi-users"
              title="Aucun membre trouvé"
              description="Modifiez votre recherche ou ajoutez un nouveau membre."
            />
          }
          className="text-sm"
          scrollable
          tableStyle={{ minWidth: '46rem' }}
        >
          <Column
            header="Utilisateur"
            sortable
            sortField="username"
            body={(user: User) => (
              <div className="flex items-center gap-3">
                <UserAvatar user={user} />
                <div>
                  <p className="font-semibold text-slate-900">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.email || "Pas d'email"} · @{user.username}
                  </p>
                </div>
              </div>
            )}
          />
          <Column
            header="Rôle"
            sortable
            sortField="role"
            body={(user: User) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag
                  value={roleLabel(user.role)}
                  severity={roleSeverity(user.role)}
                />
                {(user.roles_supplementaires ?? []).map((code) => (
                  <Tag
                    key={code}
                    value={extraRoleLabel(code)}
                    severity="secondary"
                  />
                ))}
              </div>
            )}
          />
          <Column
            header="Statut"
            body={(user: User) => (
              <span
                className={`inline-flex items-center gap-2 text-sm font-medium ${
                  user.is_active ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    user.is_active ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                {user.is_active ? 'Actif' : 'Inactif'}
              </span>
            )}
          />
          <Column
            header="Inscription"
            body={(user: User) => (
              <span className="text-sm text-slate-500">
                {formatDate(user.date_joined)}
              </span>
            )}
          />
          {isSuperAdmin && (
            <Column
              header="Actions"
              frozen
              alignFrozen="right"
              body={(user: User) => (
                <div className="flex items-center gap-1">
                  <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    aria-label={`Modifier ${user.username}`}
                    onClick={() => openEdit(user)}
                  />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    aria-label={`Supprimer ${user.username}`}
                    onClick={() => confirmDelete(user)}
                  />
                </div>
              )}
            />
          )}
        </DataTable>
      </div>

      <LazyDialogBoundary open={dialogVisible}>
        <MemberFormDialog
          visible={dialogVisible}
          member={editing}
          saving={deleteMutation.isPending}
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
