import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { confirmDialog } from 'primereact/confirmdialog'
import { annoncesApi, type AnnoncePayload } from '@/api/annonces'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { AnnoncesSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import type { Annonce } from '@/types'
import { AnnonceFormDialog } from './AnnonceFormDialog'

export function AnnoncesPage() {
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<Annonce | null>(null)
  const [search, setSearch] = useState('')

  const { data: annonces = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['annonces'],
      queryFn: () => annoncesApi.list(),
    })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return annonces
    return annonces.filter(
      (annonce) =>
        annonce.object.toLowerCase().includes(term) ||
        annonce.contenu.toLowerCase().includes(term) ||
        annonce.auteur.full_name.toLowerCase().includes(term),
    )
  }, [annonces, search])

  const createMutation = useMutation({
    mutationFn: (payload: AnnoncePayload) => annoncesApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AnnoncePayload }) =>
      annoncesApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => annoncesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['annonces'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Annonce supprimée', "L'annonce a été retirée.")
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  async function handleSubmit(payload: AnnoncePayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Annonce modifiée', "L'annonce a été mise à jour.")
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Annonce publiée', "L'annonce est maintenant visible.")
      }
      await queryClient.invalidateQueries({ queryKey: ['annonces'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
    }
  }

  function confirmDelete(annonce: Annonce) {
    confirmDialog({
      header: "Supprimer l'annonce",
      message: `Voulez-vous vraiment supprimer « ${annonce.object} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(annonce.id),
    })
  }

  if (isLoading) return <AnnoncesSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger les annonces"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Communication"
        title="Annonces"
        subtitle="Toutes les annonces publiées par l'administration et les formateurs du club."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <InputText
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une annonce…"
                className="w-full pl-9"
              />
            </div>
            {isAdmin && (
              <Button
                label="Ajouter une annonce"
                icon="pi pi-plus"
                className="rounded-full px-5"
                onClick={() => {
                  setEditing(null)
                  setDialogVisible(true)
                }}
              />
            )}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="pi pi-megaphone"
          title={search ? 'Aucune annonce correspondante' : 'Aucune annonce'}
          description={
            search
              ? 'Essayez un autre mot-clé.'
              : isAdmin
                ? 'Publiez une première annonce pour informer les membres.'
                : 'Aucune annonce publiée pour le moment.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((annonce) => (
            <article
              key={annonce.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    {annonce.object}
                  </h2>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    {formatDateTime(annonce.poster_a)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <UserAvatar user={annonce.auteur} size="sm" />
                  <span>
                    Par{' '}
                    <span className="font-semibold text-slate-800">
                      {annonce.auteur.full_name}
                    </span>
                  </span>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-600">
                {annonce.contenu}
              </p>

              {isAdmin && (
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button
                    label="Modifier"
                    icon="pi pi-pencil"
                    size="small"
                    outlined
                    severity="info"
                    onClick={() => {
                      setEditing(annonce)
                      setDialogVisible(true)
                    }}
                  />
                  <Button
                    label="Supprimer"
                    icon="pi pi-trash"
                    size="small"
                    outlined
                    severity="danger"
                    onClick={() => confirmDelete(annonce)}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <AnnonceFormDialog
        visible={dialogVisible}
        annonce={editing}
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
