import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import dayjs from 'dayjs'
import { presencesApi } from '@/api/presences'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { PresencesSkeleton } from '@/components/Skeletons'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import type { SeancePresence } from '@/types'
import { AttendanceList } from './components/AttendanceList'
import { DayFilter } from './components/DayFilter'
import { QrSessionCard } from './components/QrSessionCard'
import { libelleJour } from './components/dateLabels'

/**
 * Option « Présences » : appel par QR code.
 *
 * Un admin (ou formateur) démarre l'appel, le QR code est affiché en salle ;
 * les stagiaires qui le scannent sont marqués **présents**, les autres
 * **absents**. La liste se rafraîchit automatiquement.
 */
export function PresencesPage() {
  const { isSuperAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // null = tous les jours ; sinon la date ISO d'un jour de formation.
  const [jourActif, setJourActif] = useState<string | null>(null)

  const seancesQuery = useQuery({
    queryKey: ['presences', 'seances'],
    queryFn: presencesApi.seances,
  })
  const seances = useMemo(() => seancesQuery.data ?? [], [seancesQuery.data])
  const ouverte = seances.find((item) => item.ouverte) ?? null

  // La formation a lieu du lundi au vendredi : les séances sont classées par
  // jour et le week-end est exclu du classement (règle identique côté serveur).
  const seancesHebdo = useMemo(
    () =>
      seances.filter((item) => {
        const jour = dayjs(item.date).day()
        return jour >= 1 && jour <= 5
      }),
    [seances],
  )

  const jours = useMemo(() => {
    const parJour = new Map<string, SeancePresence[]>()
    for (const item of seancesHebdo) {
      const existant = parJour.get(item.date)
      if (existant) existant.push(item)
      else parJour.set(item.date, [item])
    }
    return [...parJour.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateJour, items]) => ({
        date: dateJour,
        label: libelleJour(dateJour),
        items,
      }))
  }, [seancesHebdo])

  // Séances du jour sélectionné (ou de tous les jours).
  const seancesVisibles = useMemo(
    () =>
      jourActif
        ? seancesHebdo.filter((item) => item.date === jourActif)
        : seancesHebdo,
    [seancesHebdo, jourActif],
  )

  // Sélecteur de séance : options regroupées par jour.
  const optionsSeances = useMemo(
    () =>
      jours
        .filter((jour) => jourActif === null || jour.date === jourActif)
        .map((jour) => ({
          label: jour.label,
          items: jour.items.map((item) => ({
            label: `${item.libelle}${item.ouverte ? ' · en cours' : ''}`,
            value: item.id,
          })),
        })),
    [jours, jourActif],
  )

  // Week-end : pas de formation, le QR code n'est pas fonctionnel.
  const jourActuel = dayjs().day()
  const estWeekend = jourActuel === 0 || jourActuel === 6

  // Séance affichée : celle choisie si elle existe encore pour le jour retenu,
  // sinon l'appel en cours, sinon la plus récente du jour.
  const seance: SeancePresence | null =
    seancesVisibles.find((s) => s.id === selectedId) ??
    seancesVisibles.find((s) => s.ouverte) ??
    seancesVisibles[0] ??
    null

  const participantsQuery = useQuery({
    queryKey: ['presences', 'participants', seance?.id ?? null],
    queryFn: () => presencesApi.participants(seance?.id as number),
    enabled: seance !== null,
    // Tant que l'appel est ouvert, la salle voit les scans arriver en direct.
    refetchInterval: seance?.ouverte ? 4000 : false,
    refetchIntervalInBackground: false,
  })

  // Absents d'abord (actionnables), puis par nom.
  const participants = useMemo(
    () =>
      [...(participantsQuery.data ?? [])].sort(
        (a, b) =>
          Number(a.present) - Number(b.present) ||
          a.last_name.localeCompare(b.last_name) ||
          a.first_name.localeCompare(b.first_name),
      ),
    [participantsQuery.data],
  )
  const presents = participants.filter((p) => p.present).length
  const absents = participants.length - presents

  const demarrerMutation = useMutation({
    mutationFn: () => presencesApi.demarrer(),
    onSuccess: (nouvelle) => {
      void queryClient.invalidateQueries({ queryKey: ['presences'] })
      setSelectedId(nouvelle.id)
      // Affiche le jour du nouvel appel pour que la séance soit visible.
      setJourActif(nouvelle.date)
      showToast(
        'success',
        'Appel démarré',
        'Affichez le QR code : les stagiaires peuvent maintenant pointer leur présence.',
      )
    },
    onError: (error) =>
      showToast('error', 'Démarrage impossible', getErrorMessage(error)),
  })

  const fermerMutation = useMutation({
    mutationFn: (id: number) => presencesApi.fermer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['presences'] })
      showToast(
        'success',
        'Appel clôturé',
        'Aucun nouveau scan ne sera accepté pour cette séance.',
      )
    },
    onError: (error) =>
      showToast('error', 'Clôture impossible', getErrorMessage(error)),
  })

  const supprimerMutation = useMutation({
    mutationFn: (id: number) => presencesApi.remove(id),
    onSuccess: () => {
      setSelectedId(null)
      void queryClient.invalidateQueries({ queryKey: ['presences'] })
      showToast('success', 'Séance supprimée', "L'historique a été mis à jour.")
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  function confirmDelete(cible: SeancePresence) {
    confirmDialog({
      header: 'Supprimer la séance',
      message: `Voulez-vous vraiment supprimer « ${cible.libelle} » ainsi que les pointages associés ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => supprimerMutation.mutate(cible.id),
    })
  }

  function selectDay(date: string | null) {
    setJourActif(date)
    setSelectedId(null)
  }

  if (seancesQuery.isLoading) return <PresencesSkeleton />

  if (seancesQuery.isError) {
    return (
      <ErrorState
        title="Impossible de charger les présences"
        description={getErrorMessage(seancesQuery.error)}
        onRetry={() => seancesQuery.refetch()}
        retrying={seancesQuery.isFetching}
      />
    )
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
        jours={jours}
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
            total={participants.length}
          />
          <AttendanceList
            seance={seance}
            seancesVisibles={seancesVisibles}
            jourActif={jourActif}
            optionsSeances={optionsSeances}
            participants={participants}
            isLoading={participantsQuery.isLoading}
            isError={participantsQuery.isError}
            error={participantsQuery.error}
            isSuperAdmin={isSuperAdmin}
            deletePending={supprimerMutation.isPending}
            onSelectSeance={setSelectedId}
            onDelete={confirmDelete}
          />
        </div>
      )}
    </div>
  )
}
