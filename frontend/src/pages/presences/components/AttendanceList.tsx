import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { UserAvatar } from '@/components/UserAvatar'
import { Icon } from '@/components/Icon'
import { getErrorMessage } from '@/lib/errors'
import type { ParticipantPresence, SeancePresence } from '@/types'
import { PresenceBadge } from './PresenceBadge'
import { libelleJour } from './dateLabels'

export function AttendanceList({
  seance,
  seancesVisibles,
  jourActif,
  optionsSeances,
  participants,
  isLoading,
  isError,
  error,
  isSuperAdmin,
  deletePending,
  onSelectSeance,
  onDelete,
}: {
  seance: SeancePresence
  seancesVisibles: SeancePresence[]
  jourActif: string | null
  optionsSeances: Array<{
    label: string
    items: Array<{ label: string; value: number }>
  }>
  participants: ParticipantPresence[]
  isLoading: boolean
  isError: boolean
  error: unknown
  isSuperAdmin: boolean
  deletePending: boolean
  onSelectSeance: (id: number) => void
  onDelete: (seance: SeancePresence) => void
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Feuille d'appel</h2>
          <p className="mt-1 text-xs text-slate-500">
            {seancesVisibles.length} séance
            {seancesVisibles.length > 1 ? 's' : ''} au registre ·{' '}
            {jourActif ? libelleJour(jourActif) : 'tous les jours'} · mise à jour
            automatique
            {seance.ouverte ? ' (toutes les 4 s)' : ''}
          </p>
        </div>

        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
          <Dropdown
            value={seance.id}
            options={optionsSeances}
            optionGroupLabel="label"
            optionGroupChildren="items"
            onChange={(event) => onSelectSeance(event.value as number)}
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
              loading={deletePending}
              onClick={() => onDelete(seance)}
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
          <Icon className="pi pi-spinner pi-spin" />
          Chargement des pointages…
        </p>
      ) : isError ? (
        <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-600">
          {getErrorMessage(error)}
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
              <PresenceBadge participant={stagiaire} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
