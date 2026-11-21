import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { EmptyState } from '@/components/Feedback'
import { Icon } from '@/components/Icon'
import { UserAvatar } from '@/components/UserAvatar'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import type { Paiement } from '@/types'

/** Une colonne du graphique : un mois, ses recettes et son nombre de versements. */
interface MonthBucket {
  key: string
  /** Abréviation courte (« nov. »). */
  label: string
  /** Intitulé complet (« novembre 2026 »). */
  labelLong: string
  /** Montant total des paiements validés du mois. */
  total: number
  /** Nombre de paiements validés du mois. */
  count: number
}

function statutSeverity(
  payment: Paiement,
): 'success' | 'warning' | 'danger' {
  const statut = payment.statut ?? 'valide'
  return statut === 'valide'
    ? 'success'
    : statut === 'en_attente'
      ? 'warning'
      : 'danger'
}

/**
 * Construit les colonnes mensuelles : du premier mois concerné par un
 * paiement (plafonné aux 12 derniers mois) jusqu'au mois courant.
 */
function buildBuckets(payments: Paiement[]): MonthBucket[] {
  const now = dayjs()
  const fin = now.startOf('month')
  const limite = fin.clone().subtract(11, 'month')

  const dates = payments
    .map((payment) => dayjs(payment.created_at))
    .filter((date) => date.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf())

  let debut = dates.length ? dates[0].startOf('month') : fin
  if (debut.isBefore(limite)) debut = limite
  // Au moins 6 colonnes : un graphique avec une seule barre est illisible.
  const minimum = fin.clone().subtract(5, 'month')
  if (debut.isAfter(minimum)) debut = minimum

  const buckets: MonthBucket[] = []
  for (
    let cursor = debut;
    cursor.isBefore(fin) || cursor.isSame(fin, 'month');
    cursor = cursor.add(1, 'month')
  ) {
    buckets.push({
      key: cursor.format('YYYY-MM'),
      label: cursor.format('MMM'),
      labelLong: cursor.format('MMMM YYYY'),
      total: 0,
      count: 0,
    })
  }

  const index = new Map(buckets.map((bucket, i) => [bucket.key, i]))
  for (const payment of payments) {
    if ((payment.statut ?? 'valide') !== 'valide') continue
    const position = index.get(dayjs(payment.created_at).format('YYYY-MM'))
    if (position === undefined) continue
    buckets[position].total += payment.montant
    buckets[position].count += 1
  }

  return buckets
}

/**
 * Historique + graphique d'évolution des recettes (caissier / super admin).
 *
 * - à gauche : barres mensuelles des paiements **validés** (montant et
 *   nombre de versements au survol) ;
 * - à droite : les derniers versements enregistrés, avec leur statut.
 */
export function PaymentsHistorySection({
  payments,
  onShowAll,
}: {
  payments: Paiement[]
  /** Bascule vers l'onglet « Historique des paiements ». */
  onShowAll: () => void
}) {
  const buckets = useMemo(() => buildBuckets(payments), [payments])

  const validees = useMemo(
    () => payments.filter((payment) => (payment.statut ?? 'valide') === 'valide'),
    [payments],
  )
  const totalPeriode = buckets.reduce((sum, bucket) => sum + bucket.total, 0)
  const nbVersements = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const maxTotal = Math.max(...buckets.map((bucket) => bucket.total), 1)

  const recents = useMemo(
    () =>
      [...payments]
        .sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf())
        .slice(0, 5),
    [payments],
  )

  return (
    <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      {/* Graphique d'évolution */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Évolution des paiements
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recettes validées par mois, sur les 12 derniers mois au maximum.
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Total période
              </p>
              <p className="text-lg font-extrabold text-fongo-700">
                {formatMoney(totalPeriode)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Versements
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {nbVersements}
              </p>
            </div>
          </div>
        </div>

        {validees.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="pi pi-chart-bar"
              title="Aucune recette enregistrée"
              description="Le graphique s'affichera dès le premier paiement validé."
            />
          </div>
        ) : (
          <div
            className="mt-6"
            role="img"
            aria-label={`Graphique des recettes validées par mois : ${formatMoney(
              totalPeriode,
            )} sur ${nbVersements} versements.`}
          >
            <div className="flex items-end gap-1.5 sm:gap-2">
              {buckets.map((bucket) => {
                const height =
                  bucket.total > 0
                    ? Math.max((bucket.total / maxTotal) * 100, 8)
                    : 0
                return (
                  <div
                    key={bucket.key}
                    className="group relative flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    {/* Infobulle au survol */}
                    <div className="pointer-events-none absolute -top-2 z-10 hidden -translate-y-full flex-col items-center whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl group-hover:flex">
                      <span className="font-semibold">{bucket.labelLong}</span>
                      <span className="text-slate-300">
                        {formatMoney(bucket.total)} · {bucket.count} versement
                        {bucket.count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <span className="h-4 text-[10px] font-bold text-slate-400">
                      {bucket.count > 0 ? `${bucket.count}×` : ''}
                    </span>

                    <div className="flex h-40 w-full items-end justify-center">
                      <div
                        className={`w-full max-w-[38px] rounded-t-lg transition-all ${
                          bucket.total > 0
                            ? 'bg-gradient-to-t from-fongo-700 to-fongo-500 group-hover:from-fongo-800 group-hover:to-fongo-600'
                            : 'bg-slate-100'
                        }`}
                        style={{
                          height: `${bucket.total > 0 ? height : 4}%`,
                        }}
                      />
                    </div>

                    <span className="truncate text-[10px] font-semibold capitalize text-slate-400">
                      {bucket.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-fongo-600" />
                Montant validé du mois
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                Aucune recette ce mois-là
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <Icon className="pi pi-info-circle" />
                Survolez une barre pour le détail
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Derniers versements */}
      <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Derniers versements
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Les {recents.length} paiements les plus récents.
            </p>
          </div>
          <Icon className="pi pi-history text-slate-300" />
        </div>

        {recents.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="pi pi-wallet"
              title="Aucun paiement"
              description="Les versements enregistrés apparaîtront ici."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {recents.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <UserAvatar user={payment.stagiaire} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {payment.stagiaire?.full_name ?? 'Stagiaire inconnu'}
                  </p>
                  <p
                    className="truncate text-xs text-slate-500"
                    title={`${payment.description} — ${formatDateTime(payment.created_at)}`}
                  >
                    {payment.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-fongo-700">
                    {formatMoney(payment.montant)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
                <Tag
                  value={payment.statut_display ?? payment.statut ?? 'Validé'}
                  severity={statutSeverity(payment)}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-4">
          <Button
            label="Voir tout l'historique"
            icon="pi pi-list"
            outlined
            severity="info"
            className="w-full rounded-full"
            onClick={onShowAll}
          />
        </div>
      </div>
    </section>
  )
}
