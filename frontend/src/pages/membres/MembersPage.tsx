import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { InputText } from 'primereact/inputtext'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { usersApi, type UserPayload } from '@/api/users'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { MembersSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, roleLabel } from '@/lib/format'
import type { User } from '@/types'
import { MemberFormDialog } from './MemberFormDialog'

type Filter = 'all' | 'stagiaire' | 'admin'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'stagiaire', label: 'Stagiaires' },
  { key: 'admin', label: 'Administrateurs' },
]

function roleSeverity(role: User['role']) {
  if (role === 'super_admin') return 'warning'
  if (role === 'admin') return 'info'
  return 'success'
}

export function MembersPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const { data: users = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['users'],
      queryFn: () => usersApi.list(),
    })

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditing(null)
      setDialogVisible(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filteredUsers = useMemo(() => {
    if (filter === 'all') return users
    if (filter === 'admin') {
      return users.filter((user) => user.role === 'admin' || user.role === 'super_admin')
    }
    return users.filter((user) => user.role === 'stagiaire')
  }, [filter, users])

  const counts = useMemo(
    () => ({
      all: users.length,
      stagiaire: users.filter((user) => user.role === 'stagiaire').length,
      admin: users.filter(
        (user) => user.role === 'admin' || user.role === 'super_admin',
      ).length,
    }),
    [users],
  )

  const createMutation = useMutation({
    mutationFn: ({
      payload,
      picture,
    }: {
      payload: UserPayload
      picture: File | null
    }) => usersApi.create(payload, picture),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
      picture,
    }: {
      id: number
      payload: UserPayload
      picture: File | null
    }) => usersApi.update(id, payload, picture),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Membre supprimé', 'Le compte a été supprimé avec succès.')
    },
    onError: (error) => {
      showToast('error', 'Suppression impossible', getErrorMessage(error))
    },
  })

  async function handleSubmit(payload: UserPayload, picture: File | null) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload, picture })
        showToast('success', 'Membre modifié', 'Les informations ont été mises à jour.')
      } else {
        await createMutation.mutateAsync({ payload, picture })
        showToast('success', 'Membre ajouté', 'Le nouveau compte a été créé.')
      }
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
    }
  }

  function openCreate() {
    setEditing(null)
    setDialogVisible(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setDialogVisible(true)
  }

  function confirmDelete(user: User) {
    confirmDialog({
      header: 'Supprimer le membre',
      message: `Voulez-vous vraiment supprimer « ${user.username} » ? Cette action est irréversible.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(user.id),
    })
  }

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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des membres"
        subtitle="Créez, filtrez et mettez à jour les comptes des stagiaires et administrateurs du club."
        actions={
          <Button
            label="Ajouter un utilisateur"
            icon="pi pi-plus"
            onClick={openCreate}
            className="rounded-full px-5"
          />
        }
      />

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
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
          <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
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
          responsiveLayout="scroll"
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
              <Tag
                value={roleLabel(user.role)}
                severity={roleSeverity(user.role)}
              />
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
          <Column
            header="Actions"
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
        </DataTable>
      </div>

      <MemberFormDialog
        visible={dialogVisible}
        member={editing}
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
