import { useQuery } from '@tanstack/react-query'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { financeApi } from '@/api/finance'
import { ErrorState, EmptyState } from '@/components/Feedback'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeletons'
import { UserAvatar } from '@/components/UserAvatar'
import { Icon } from '@/components/Icon'
import { getErrorMessage } from '@/lib/errors'
import type { StagiaireProgress } from '@/types'

/** Statut déduit du pourcentage réglé (aucun montant manipulé ici). */
function statutDe(pourcentage: number) {
  if (pourcentage >= 100) return { label: 'Complet', severity: 'info' as const }
  if (pourcentage > 0) return { label: 'À jour', severity: 'success' as const }
  return { label: 'En retard', severity: 'danger' as const }
}

/**
 * Vue Finance des administrateurs non caissiers.
 *
 * Lecture restreinte : **nom** des stagiaires et **pourcentage** de la
 * formation réglé uniquement. Aucun montant n'est affiché ni récupéré —
 * l'appel `finance/progress/` ne renvoie jamais de sommes.
 */
export function FinanceProgress() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['finance-progress'],
    queryFn: financeApi.progress,
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in-up" role="status" aria-live="polite">
        <span className="sr-only">Chargement de l'avancement…</span>
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="ml-auto h-2.5 w-48 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger l'avancement"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  const stagiaires = data ?? []

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Gestion financière"
        title="Finance"
        subtitle="Suivez l'avancement des versements des stagiaires : seul le pourcentage réglé est visible avec votre profil."
      />

      {/* Rappel du périmètre : pas de montants pour ce profil. */}
      <div className="flex items-start gap-3 rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <Icon className="pi pi-info-circle mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold">Lecture restreinte.</span> Votre
          profil permet de consulter les noms des stagiaires et leur
          pourcentage de formation réglé. Les montants versés, les totaux et la
          gestion des paiements restent réservés aux caissiers et au super
          administrateur.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={stagiaires}
          dataKey="id"
          paginator
          rows={8}
          rowsPerPageOptions={[8, 16, 32]}
          sortField="pourcentage"
          sortOrder={-1}
          emptyMessage={
            <EmptyState
              icon="pi pi-users"
              title="Aucun stagiaire"
              description="Aucun profil stagiaire n'est enregistré pour le moment."
            />
          }
          scrollable
          tableStyle={{ minWidth: '40rem' }}
          className="text-sm"
        >
          <Column
            header="Stagiaire"
            field="full_name"
            sortable
            body={(stagiaire: StagiaireProgress) => (
              <div className="flex items-center gap-3">
                <UserAvatar user={stagiaire} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {stagiaire.full_name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    @{stagiaire.username}
                  </p>
                </div>
              </div>
            )}
          />
          <Column
            header="Progression"
            field="pourcentage"
            sortable
            body={(stagiaire: StagiaireProgress) => (
              <div className="w-56">
                <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>{stagiaire.pourcentage}% réglé</span>
                  <span>
                    {stagiaire.pourcentage >= 100 ? 'Formation soldée' : 'En cours'}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stagiaire.pourcentage >= 100
                        ? 'bg-emerald-500'
                        : stagiaire.pourcentage > 0
                          ? 'bg-fongo-600'
                          : 'bg-slate-300'
                    }`}
                    style={{ width: `${stagiaire.pourcentage}%` }}
                  />
                </div>
              </div>
            )}
          />
          <Column
            header="Statut"
            body={(stagiaire: StagiaireProgress) => {
              const statut = statutDe(stagiaire.pourcentage)
              return <Tag value={statut.label} severity={statut.severity} />
            }}
          />
        </DataTable>
      </div>
    </div>
  )
}
