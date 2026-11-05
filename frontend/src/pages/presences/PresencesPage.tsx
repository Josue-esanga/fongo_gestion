import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import dayjs from 'dayjs'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { usePresences } from '@/hooks/usePresences'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { PresencesSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { Icon } from '@/components/Icon'
import type { SeancePresence } from '@/types'
import { AttendanceList } from './components/AttendanceList'
import { DayFilter } from './components/DayFilter'
import { QrSessionCard } from './components/QrSessionCard'

export function PresencesPage() {
  const { isSuperAdmin } = useAuth()

  const {
    seancesHebdo,
    jours,
    optionsSeances,
    ouverte,
    seance,
    participants,
    presents,
    absents,
    totalParticipants,
    isLoading,
    isError,
    error,
    isFetching,
    estWeekend,
    jourActif,
    demarrerMutation,
    fermerMutation,
    deleteSeance,
    selectDay,
    selectSeance,
  } = usePresences()

  if (isLoading) return <PresencesSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger les présences"
        description={getErrorMessage(error)}
        onRetry={() => {
          // Le refetch est géré par React Query
        }}
        retrying={isFetching}
      />
    )
  }

  function confirmDelete(cible: SeancePresence) {
    confirmDialog({
      header: 'Supprimer la séance',
      message: `Voulez-vous vraiment supprimer « ${cible.libelle} » ainsi que les pointages associés ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteSeance(cible.id),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Administration"
        title="Présences & absences"
        subtitle="Appel par QR code : les stagiaires qui scannent sont marqués présents, les autres absents."
        actions={
          ouverte ? (
            <div className="flex flex-wrap gap-2">
              <Button
                label="Clôturer l'appel"
                icon="pi pi-lock"
                outlined
                severity="secondary"
                loading={fermerMutation.isPending}
                onClick={() => fermerMutation.mutate(ouverte.id)}
              />
              <Button
                label="Nouvel appel"
                icon="pi pi-refresh"
                loading={demarrerMutation.isPending}
                disabled={estWeekend}
                onClick={() => demarrerMutation.mutate()}
              />
            </div>
          ) : (
            <Button
              label="Démarrer l'appel"
              icon="pi pi-play"
              loading={demarrerMutation.isPending}
              disabled={estWeekend}
              onClick={() => demarrerMutation.mutate()}
            />
          )
        }
      />

      {estWeekend && (
        <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
          <Icon className="pi pi-calendar-times mt-0.5 shrink-0" />
          <p>
            <strong>Week-end :</strong> la formation a lieu du lundi au vendredi.
            Aucun appel ne peut être démarré et les QR codes ne sont pas
            fonctionnels jusqu'au lundi.
          </p>
        </div>
      )}

      <DayFilter
        jours={jours.map((j) => ({
          date: j.date,
          label: dayjs(j.date).format('dddd DD MMMM'),
          items: j.items,
        }))}
        total={seancesHebdo.length}
        jourActif={jourActif}
        onChange={selectDay}
      />

      {seance === null ? (
        <EmptyState
          icon="pi pi-qrcode"
          title={jourActif ? 'Aucun appel ce jour-là' : 'Aucun appel commencé'}
          description={
            jourActif
              ? 'Choisissez un autre jour dans le classement, ou démarrez un nouvel appel pour générer un QR code.'
              : 'Démarrez un appel pour générer le QR code que les stagiaires scanneront depuis leur application.'
          }
          action={
            <Button
              label="Démarrer l'appel"
              icon="pi pi-play"
              loading={demarrerMutation.isPending}
              disabled={estWeekend}
              onClick={() => demarrerMutation.mutate()}
            />
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <QrSessionCard
            seance={seance}
            presents={presents}
            absents={absents}
            total={totalParticipants}
          />
          <AttendanceList
            seance={seance}
            seancesVisibles={seancesHebdo}
            jourActif={jourActif}
            optionsSeances={optionsSeances}
            participants={participants}
            isLoading={false}
            isError={false}
            error={null}
            isSuperAdmin={isSuperAdmin}
            deletePending={false}
            onSelectSeance={selectSeance}
            onDelete={confirmDelete}
          />
        </div>
      )}
    </div>
  )
}
