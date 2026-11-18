import { useQuery } from '@tanstack/react-query'
import { Tag } from 'primereact/tag'
import dayjs from 'dayjs'
import { presencesApi } from '@/api/presences'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeletons'
import { getErrorMessage } from '@/lib/errors'
import { MaPresenceCard } from './MaPresenceCard'

/**
 * Espace personnel du stagiaire : statut du jour (scan QR), compteurs de
 * présences / absences et liste de ses appels depuis son inscription.
 */
export function MesPresencesPage() {
  const query = useQuery({
    queryKey: ['ma-presence', 'historique'],
    queryFn: presencesApi.historique,
  })

  const seances = query.data ?? []

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Mon espace"
        title="Mes présences"
        subtitle="Votre suivi d'assistance : le pointage du jour par QR code et l'historique de vos présences et absences."
      />

      {/* Statut du jour, compteurs et bouton de scan. */}
      <MaPresenceCard />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          Historique des appels
        </h2>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : query.isError ? (
          <ErrorState
            title="Impossible de charger l'historique"
            description={getErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        ) : seances.length === 0 ? (
          <EmptyState
            icon="pi pi-qrcode"
            title="Aucun appel pour le moment"
            description="Votre historique s'affichera dès qu'un administrateur démarrera un appel en classe."
          />
        ) : (
          <ul className="space-y-3">
            {seances.map((seance) => (
              <li
                key={seance.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold text-slate-800">
                    {seance.libelle}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-500">
                    {dayjs(seance.date).format('dddd DD/MM/YYYY')}
                  </p>
                </div>
                <Tag
                  severity={seance.present ? 'success' : 'danger'}
                  value={
                    seance.present
                      ? seance.horodatage
                        ? `Présent · ${dayjs(seance.horodatage).format('HH:mm')}`
                        : 'Présent'
                      : 'Absent'
                  }
                  icon={
                    seance.present ? 'pi pi-check-circle' : 'pi pi-times-circle'
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
