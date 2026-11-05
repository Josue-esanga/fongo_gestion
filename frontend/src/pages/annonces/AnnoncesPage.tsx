import { useState } from 'react'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { confirmDialog } from 'primereact/confirmdialog'
import { lazyNamed } from '@/lib/lazy'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { FongoExpoSession } from '@/components/FongoExpoSession'
import { AnnoncesSkeleton } from '@/components/Skeletons'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { useAnnonces } from '@/hooks/useAnnonces'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import type { Annonce } from '@/types'

const AnnonceFormDialog = lazyNamed(
  () => import('./AnnonceFormDialog'),
  'AnnonceFormDialog',
)

export function AnnoncesPage() {
  const { can } = useAuth()
  const canManage = can('annonces')

  const {
    annonces,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    search,
    setSearch,
    editing,
    setEditing,
    handleSubmit,
    saving,
    deleteAnnonce,
    formatDateTime,
    annonceCibleLabel,
    annonceCibleSeverity,
    truncateText,
  } = useAnnonces()

  const [dialogVisible, setDialogVisible] = useState(false)

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

  function confirmDelete(annonce: Annonce) {
    confirmDialog({
      header: "Supprimer l'annonce",
      message: `Voulez-vous vraiment supprimer « ${annonce.object} » ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => {
        deleteAnnonce(annonce.id)
      },
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Communication"
        title="Annonces"
        subtitle="Les annonces du club, affichées selon le public visé : tout le monde, les administrateurs ou les stagiaires."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Icon className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <InputText
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une annonce…"
                className="w-full pl-9"
              />
            </div>
            {canManage && (
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

      {annonces.length === 0 ? (
        <EmptyState
          icon="pi pi-megaphone"
          title={search ? 'Aucune annonce correspondante' : 'Aucune annonce'}
          description={
            search
              ? 'Essayez un autre mot-clé.'
              : canManage
                ? 'Publiez une première annonce pour informer les membres.'
                : 'Aucune annonce publiée pour le moment.'
          }
        />
      ) : (
        <div className="space-y-4">
          {annonces.map((annonce) => (
            <article
              key={annonce.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag
                      value={annonce.cible_display ?? annonceCibleLabel(annonce.cible)}
                      severity={annonceCibleSeverity(annonce.cible)}
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      <Icon className="pi pi-calendar" />
                      Prévue le {formatDateTime(annonce.date_prevue)}
                    </span>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Publié le {formatDateTime(annonce.poster_a)}
                    </p>
                  </div>
                  <h2 className="mt-2 break-words text-xl font-bold text-slate-900">
                    {annonce.object}
                  </h2>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                  <span className="shrink-0">
                    <UserAvatar user={annonce.auteur} size="sm" />
                  </span>
                  <span className="break-words">
                    Par{' '}
                    <span className="font-semibold text-slate-800">
                      {annonce.auteur.full_name}
                    </span>
                  </span>
                </div>
              </div>

              {annonce.template === 'fongo_expo' ? (
                <div className="-mx-6 mt-4 overflow-hidden border-y border-slate-100 bg-slate-50 sm:mx-0 sm:rounded-2xl sm:border-0 sm:p-4">
                  <FongoExpoSession
                    dateInfo={`Prévue le ${formatDateTime(annonce.date_prevue)}`}
                    subTitle={truncateText(annonce.contenu)}
                    catchphrase={annonce.object}
                    imageFront={annonce.image1}
                    imageBack={annonce.image2}
                  />
                </div>
              ) : (
                <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-600">
                  {annonce.contenu}
                </p>
              )}

              {canManage && (
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

      {dialogVisible && (
        <LazyDialogBoundary open={dialogVisible}>
          <AnnonceFormDialog
            visible={dialogVisible}
            annonce={editing}
            saving={saving}
            onHide={() => {
              setDialogVisible(false)
              setEditing(null)
            }}
            onSubmit={handleSubmit}
          />
        </LazyDialogBoundary>
      )}
    </div>
  )
}
