import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { QRCodeSVG } from 'qrcode.react'
import dayjs from 'dayjs'
import { presencesApi } from '@/api/presences'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { PageHeader } from '@/components/PageHeader'
import { PresencesSkeleton } from '@/components/Skeletons'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import type { ParticipantPresence, SeancePresence } from '@/types'

function statutBadge(present: ParticipantPresence) {
  return present.present ? (
    <Tag
      severity="success"
      value={`Présent · ${dayjs(present.horodatage).format('HH:mm')}`}
      icon="pi pi-check-circle"
    />
  ) : (
    <Tag severity="danger" value="Absent" icon="pi pi-times-circle" />
  )
}

/** Libellé d'un jour : « Aujourd'hui », « Hier », sinon « jeudi 29 octobre ». */
function libelleJour(dateIso: string): string {
  const jour = dayjs(dateIso).startOf('day')
  const ecart = jour.diff(dayjs().startOf('day'), 'day')
  if (ecart === 0) return "Aujourd'hui"
  if (ecart === -1) return 'Hier'
  return jour
    .format('dddd D MMMM')
    .replace(/^./, (lettre) => lettre.toUpperCase())
}

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
          <i className="pi pi-calendar-times mt-0.5 shrink-0" />
          <p>
            <strong>Week-end :</strong> la formation a lieu du lundi au
            vendredi. Aucun appel ne peut être démarré et les QR codes ne sont
            pas fonctionnels jusqu'au lundi.
          </p>
        </div>
      )}

      {jours.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:inline">
            Classement par jour
          </span>
          <Button
            size="small"
            rounded
            label={`Tous les jours (${seancesHebdo.length})`}
            severity={jourActif === null ? 'info' : 'secondary'}
            outlined={jourActif !== null}
            onClick={() => {
              setJourActif(null)
              setSelectedId(null)
            }}
          />
          {jours.map((jour) => (
            <Button
              key={jour.date}
              size="small"
              rounded
              label={`${jour.label} (${jour.items.length})`}
              severity={jourActif === jour.date ? 'info' : 'secondary'}
              outlined={jourActif !== jour.date}
              onClick={() => {
                setJourActif(jour.date)
                setSelectedId(null)
              }}
            />
          ))}
        </div>
      )}

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
          {/* QR code affiché en salle */}
          <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fongo-500">
                  {seance.ouverte ? 'Appel en cours' : 'Appel clôturé'}
                </p>
                <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                  {seance.libelle}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDateTime(seance.created_at)}
                  {seance.creee_par_nom ? ` · ${seance.creee_par_nom}` : ''}
                </p>
              </div>
              <Tag
                severity={seance.ouverte ? 'success' : 'secondary'}
                value={seance.ouverte ? 'Ouvert' : 'Fermé'}
              />
            </div>

            {seance.ouverte ? (
              <>
                <div className="flex justify-center rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
                  <div className="rounded-2xl bg-white p-2 shadow-sm sm:p-3">
                    <QRCodeSVG
                      value={seance.qr_payload}
                      size={200}
                      level="M"
                      aria-label="QR code de présence"
                    />
                  </div>
                </div>
                <p className="text-center text-sm leading-6 text-slate-600">
                  Affichez ce QR code en salle. Chaque stagiaire le scanne depuis
                  l'application :{' '}
                  <span className="font-semibold text-slate-800">
                    Tableau de bord → Ma présence → Scanner le QR
                  </span>
                  .
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <i className="pi pi-ban text-xl" />
                </span>
                <p className="max-w-xs text-sm text-slate-500">
                  Cet appel est terminé : son QR code n'est plus valable.
                  Démarrez un nouvel appel pour continuer le pointage.
                </p>
              </div>
            )}

            {/* min-w-0 sur chaque cellule : les libellés (mot « Stagiaires »
                non cassable) ne peuvent plus élargir la grille au-delà de
                l'écran — c'est ce qui créait un défilement horizontal. */}
            <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
              <div className="min-w-0 rounded-2xl bg-emerald-50 p-2 sm:p-3">
                <p className="text-lg font-extrabold text-emerald-600 sm:text-xl">
                  {presents}
                </p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-600/80 sm:text-[11px]">
                  Présents
                </p>
              </div>
              <div className="min-w-0 rounded-2xl bg-red-50 p-2 sm:p-3">
                <p className="text-lg font-extrabold text-red-600 sm:text-xl">
                  {absents}
                </p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-red-600/80 sm:text-[11px]">
                  Absents
                </p>
              </div>
              <div className="min-w-0 rounded-2xl bg-slate-100 p-2 sm:p-3">
                <p className="text-lg font-extrabold text-slate-700 sm:text-xl">
                  {participants.length}
                </p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
                  Stagiaires
                </p>
              </div>
            </div>
          </section>

          {/* Liste stagiaires : présent / absent */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Feuille d'appel
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {seancesVisibles.length} séance
                  {seancesVisibles.length > 1 ? 's' : ''} au registre ·{' '}
                  {jourActif ? libelleJour(jourActif) : 'tous les jours'} · mise
                  à jour automatique
                  {seance.ouverte ? ' (toutes les 4 s)' : ''}
                </p>
              </div>

              <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                <Dropdown
                  value={seance.id}
                  options={optionsSeances}
                  optionGroupLabel="label"
                  optionGroupChildren="items"
                  onChange={(event) => setSelectedId(event.value as number)}
                  className="min-w-0 flex-1 sm:w-64 sm:flex-none"
                  panelClassName="max-w-[90vw]"
                  aria-label="Choisir une séance"
                />
                {isSuperAdmin && (
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    className="shrink-0"
                    aria-label="Supprimer la séance"
                    loading={supprimerMutation.isPending}
                    onClick={() => confirmDelete(seance)}
                  />
                )}
              </div>
            </div>

            {participantsQuery.isLoading ? (
              <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                <i className="pi pi-spinner pi-spin" />
                Chargement des pointages…
              </p>
            ) : participantsQuery.isError ? (
              <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-600">
                {getErrorMessage(participantsQuery.error)}
              </p>
            ) : participants.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Aucun stagiaire inscrit pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {participants.map((stagiaire) => (
                  <li
                    key={stagiaire.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar user={stagiaire} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {stagiaire.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          @{stagiaire.username}
                        </p>
                      </div>
                    </div>
                    {statutBadge(stagiaire)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
