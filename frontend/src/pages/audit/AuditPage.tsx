import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Tag } from 'primereact/tag'
import { getErrorMessage } from '@/lib/errors'
import {
  auditActionLabel,
  auditActionSeverity,
  auditModelLabel,
  formatDate,
  formatDateTime,
} from '@/lib/format'
import { useAudit } from '@/hooks/useAudit'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { AuditSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { Icon } from '@/components/Icon'
import type { AuditAction, AuditLog, AuditSummary } from '@/types'

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string
  value: string | number
  hint: string
  icon: string
  accent: string
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 break-words text-3xl font-extrabold leading-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 break-words text-xs text-slate-500">{hint}</p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${accent}`}
        >
          <Icon className={icon} />
        </span>
      </div>
    </div>
  )
}

/** Affichage court d'une valeur avant / après (JSON → texte lisible). */
function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function changesSummary(log: AuditLog): string {
  const entries = Object.entries(log.changes ?? {})
  if (entries.length === 0) return '—'
  const first = entries[0]
  const base = `${first[0]} : ${renderValue(first[1].old)} → ${renderValue(first[1].new)}`
  return entries.length > 1 ? `${base} (+${entries.length - 1})` : base
}

function ActionBreakdown({ summary }: { summary: AuditSummary }) {
  const total = Math.max(
    1,
    summary.by_action.reduce((sum, item) => sum + item.count, 0),
  )

  return (
    <div className="space-y-3">
      {summary.by_action.map((item) => (
        <div key={item.action} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-700">{item.label}</span>
            <span className="font-bold text-slate-900">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                item.action === 'delete'
                  ? 'bg-red-400'
                  : item.action === 'create'
                    ? 'bg-emerald-400'
                    : item.action === 'update'
                      ? 'bg-sky-400'
                      : 'bg-slate-300'
              }`}
              style={{ width: `${Math.round((item.count / total) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DailyActivity({ summary }: { summary: AuditSummary }) {
  const max = Math.max(1, ...summary.daily.map((day) => day.count))
  const first = summary.daily[0]
  const last = summary.daily[summary.daily.length - 1]

  return (
    <div>
      <div className="flex h-44 items-end gap-1.5">
        {summary.daily.map((day) => {
          const ratio = day.count / max
          return (
            <div
              key={day.date}
              className="flex h-full flex-1 items-end"
              title={`${formatDate(day.date)} : ${day.count} action${
                day.count > 1 ? 's' : ''
              }`}
            >
              <div
                className={`w-full rounded-t-md transition ${
                  day.count > 0
                    ? 'bg-fongo-600 hover:bg-fongo-700'
                    : 'bg-slate-100'
                }`}
                style={{
                  height: `${day.count > 0 ? Math.max(8, ratio * 100) : 3}%`,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{first ? formatDate(first.date) : '—'}</span>
        <span className="font-semibold text-slate-500">
          {summary.daily.reduce((sum, day) => sum + day.count, 0)} actions sur{' '}
          {summary.daily.length} jours
        </span>
        <span>{last ? formatDate(last.date) : '—'}</span>
      </div>
    </div>
  )
}

export function AuditPage() {
  const {
    logs,
    summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    searchInput,
    setSearchInput,
    action,
    setAction,
    modelLabel,
    setModelLabel,
    modelOptions,
    hasFilters,
    resetFilters,
    selected,
    setSelected,
  } = useAudit()

  if (isLoading) return <AuditSkeleton />

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger le journal d'audit"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  const actionOptions = (summary?.by_action ?? []).map((item) => ({
    label: item.label,
    value: item.action,
  }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Administration"
        title="Journal d'audit"
        subtitle="Qui a fait quoi, quand et depuis où : chaque création, modification, suppression et connexion du projet est enregistrée automatiquement."
        actions={
          <Button
            label="Actualiser"
            icon="pi pi-refresh"
            outlined
            loading={isFetching}
            className="rounded-full px-5"
            onClick={() => refetch()}
          />
        }
      />

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Actions tracées"
              value={summary.totals.events}
              hint="Depuis la mise en place de l'audit"
              icon="pi pi-history"
              accent="bg-fongo-100 text-fongo-700"
            />
            <StatCard
              label="Aujourd'hui"
              value={summary.totals.today}
              hint={`${summary.totals.week} action${summary.totals.week > 1 ? 's' : ''} sur 7 jours`}
              icon="pi pi-calendar"
              accent="bg-sky-100 text-sky-700"
            />
            <StatCard
              label="Comptes impliqués"
              value={summary.totals.users}
              hint="Utilisateurs ayant laissé une trace"
              icon="pi pi-users"
              accent="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              label="Sections suivies"
              value={summary.tracked_models.length}
              hint="Modèles audités automatiquement"
              icon="pi pi-eye"
              accent="bg-amber-100 text-amber-700"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Activité des 14 derniers jours
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Volume d'écritures journalisées, jour par jour.
                </p>
              </div>
              <DailyActivity summary={summary} />
            </section>

            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Répartition</h2>
                <p className="mb-4 mt-1 text-xs text-slate-500">
                  Par type d'action.
                </p>
                <ActionBreakdown summary={summary} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Comptes les plus actifs
                </h2>
                <p className="mb-3 mt-1 text-xs text-slate-500">
                  30 derniers jours.
                </p>
                {summary.top_users.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune activité récente.</p>
                ) : (
                  <ul className="space-y-2">
                    {summary.top_users.map((row) => (
                      <li
                        key={row.user}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate font-semibold text-slate-700">
                          {row.username}
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                          {row.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Les statistiques d'audit sont indisponibles pour le moment : le
          journal reste consultable ci-dessous.
        </div>
      )}

      {/* Filtres : recherche « qui a fait quoi », action, ressource. */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={action || null}
            options={actionOptions}
            onChange={(event) => setAction((event.value ?? '') as AuditAction | '')}
            placeholder="Toutes les actions"
            showClear
            className="min-w-[13rem]"
            aria-label="Filtrer par action"
          />
          <Dropdown
            value={modelLabel || null}
            options={modelOptions}
            onChange={(event) => setModelLabel((event.value ?? '') as string)}
            placeholder="Toutes les ressources"
            showClear
            filter
            className="min-w-[13rem]"
            aria-label="Filtrer par ressource"
          />
          {hasFilters && (
            <Button
              label="Réinitialiser"
              icon="pi pi-filter-slash"
              text
              severity="secondary"
              onClick={resetFilters}
            />
          )}
        </div>

        <div className="relative w-full lg:w-80">
          <Icon className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <InputText
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher un utilisateur, une ressource…"
            className="w-full pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={logs}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          onRowClick={(event) => setSelected(event.data as AuditLog)}
          rowHover
          emptyMessage={
            <EmptyState
              icon="pi pi-history"
              title="Aucune entrée d'audit"
              description={
                hasFilters
                  ? 'Modifiez votre recherche ou vos filtres pour élargir les résultats.'
                  : "Le journal se remplira au fil des actions effectuées dans l'application."
              }
              action={
                hasFilters ? (
                  <Button
                    label="Réinitialiser les filtres"
                    icon="pi pi-filter-slash"
                    className="rounded-full"
                    onClick={resetFilters}
                  />
                ) : undefined
              }
            />
          }
          className="cursor-pointer text-sm"
          scrollable
          tableStyle={{ minWidth: '58rem' }}
        >
          <Column
            header="Date"
            field="created_at"
            sortable
            body={(log: AuditLog) => (
              <span className="whitespace-nowrap text-sm text-slate-600">
                {formatDateTime(log.created_at)}
              </span>
            )}
          />
          <Column
            header="Utilisateur"
            body={(log: AuditLog) => (
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fongo-100 text-xs font-bold uppercase text-fongo-700">
                  {log.username.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {log.user?.full_name || log.username}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {log.user ? `@${log.user.username}` : 'Compte supprimé'}
                  </p>
                </div>
              </div>
            )}
          />
          <Column
            header="Action"
            body={(log: AuditLog) => (
              <Tag
                value={log.action_display || auditActionLabel(log.action)}
                severity={auditActionSeverity(log.action)}
              />
            )}
          />
          <Column
            header="Ressource"
            body={(log: AuditLog) =>
              log.model_label ? (
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">
                    {auditModelLabel(log.model_label)}
                  </p>
                  <p className="max-w-[16rem] truncate text-xs text-slate-500">
                    {log.object_repr || `#${log.object_id}`}
                  </p>
                </div>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
          />
          <Column
            header="Détail"
            body={(log: AuditLog) => (
              <p className="max-w-[18rem] truncate text-sm text-slate-600">
                {log.model_label ? changesSummary(log) : log.object_repr}
              </p>
            )}
          />
          <Column
            header="Adresse IP"
            body={(log: AuditLog) => (
              <span className="whitespace-nowrap font-mono text-xs text-slate-500">
                {log.ip_address ?? '—'}
              </span>
            )}
          />
        </DataTable>
      </div>

      {summary && summary.tracked_models.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Ce que l'audit suit automatiquement
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Toute écriture sur ces ressources (création, modification,
            suppression) est journalisée sans action supplémentaire.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {summary.tracked_models.map((model) => (
              <Tag
                key={model.label}
                value={auditModelLabel(model.label)}
                severity="secondary"
                className="text-xs"
              />
            ))}
          </div>
        </section>
      )}

      <Dialog
        visible={Boolean(selected)}
        onHide={() => setSelected(null)}
        header="Détail de l'action"
        modal
        className="w-full max-w-2xl"
        contentClassName="rounded-b-3xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Tag
                value={selected.action_display || auditActionLabel(selected.action)}
                severity={auditActionSeverity(selected.action)}
              />
              <span className="text-sm text-slate-500">
                {formatDateTime(selected.created_at)}
              </span>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Auteur
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {selected.user?.full_name || selected.username}
                  <span className="block font-normal text-slate-500">
                    {selected.user ? `@${selected.user.username}` : 'Compte supprimé'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Ressource
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">
                  {auditModelLabel(selected.model_label)}
                  <span className="block font-normal text-slate-500">
                    {selected.object_repr || '—'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Adresse IP
                </dt>
                <dd className="mt-1 font-mono text-sm text-slate-700">
                  {selected.ip_address ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Appareil
                </dt>
                <dd className="mt-1 break-words text-sm text-slate-700">
                  {selected.user_agent || '—'}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {selected.action === 'update'
                  ? 'Champs modifiés'
                  : 'Informations'}
              </h3>
              {Object.keys(selected.changes ?? {}).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Aucun détail de modification pour cette action.
                </p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-2.5">Champ</th>
                        <th className="px-4 py-2.5">Avant</th>
                        <th className="px-4 py-2.5">Après</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(selected.changes).map(([field, change]) => (
                        <tr key={field}>
                          <td className="px-4 py-2.5 font-semibold text-slate-700">
                            {field}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {renderValue(change.old)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-800">
                            {renderValue(change.new)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
