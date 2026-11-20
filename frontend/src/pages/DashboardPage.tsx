import { Link } from 'react-router-dom'
import { Button } from 'primereact/button'
import { ErrorState } from '@/components/Feedback'
import { DashboardSkeleton } from '@/components/Skeletons'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatMoney, roleLabel, truncateText } from '@/lib/format'
import { FongoExpoSession } from '@/components/FongoExpoSession'
import { Icon } from '@/components/Icon'
import { useDashboard } from '@/hooks/useDashboard'

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
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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

export function DashboardPage() {
  const { can, isSuperAdmin, isStagiaire } = useAuth()
  const canManageFinance = can('finance')
  const canManageDevoirs = can('devoirs')
  const canManageAnnonces = can('annonces')
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (isError || !data) {
    return (
      <ErrorState
        title="Tableau de bord indisponible"
        description={getErrorMessage(error)}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    )
  }

  const roleTotal = data.repartition_roles.reduce(
    (total, item) => total + item.nombre,
    0,
  )

  // Un admin ne gère que les sections couvertes par ses rôles
  // supplémentaires : on lui annonce précisément ce qu'il peut faire.
  const adminPrivileges: string[] = []
  if (canManageDevoirs) adminPrivileges.push('publier et modifier les devoirs')
  if (canManageFinance) adminPrivileges.push('enregistrer et valider les versements')
  if (canManageAnnonces) adminPrivileges.push('publier les annonces du club')
  const adminParagraph = adminPrivileges.length
    ? ` Vous pouvez ${adminPrivileges.join(', et ')}.`
    : ' La modification de ces sections reste réservée au super administrateur.'

  return (
    <div className="space-y-7 animate-fade-in-up">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-fongo-50/60 to-fongo-50 p-6 shadow-sm sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="min-w-0 space-y-5">
            <span className="inline-flex rounded-full bg-fongo-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-fongo-900">
              Tableau de bord
            </span>
            <h1 className="text-balance break-words text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Bonjour{' '}
              <span className="text-fongo-700">{data.utilisateur.full_name}</span>,
              bienvenue sur FongoGestion
            </h1>
            <p className="max-w-2xl break-words text-sm leading-7 text-slate-600 sm:text-base">
              {isSuperAdmin
                ? "Gérez vos stagiaires, vos finances et l'ensemble des activités du comité FongoLab avec une interface claire et moderne."
                : isStagiaire
                  ? 'Consultez vos devoirs, vos versements, les annonces du club et votre suivi de présence en toute simplicité.'
                  : `Parcourez les membres, le planning, les annonces et les devoirs du club, et lancez l'appel en salle depuis l'espace Présences.${adminParagraph}`}
            </p>
            <div className="flex flex-wrap gap-3">
              {isSuperAdmin ? (
                <>
                  <Link to="/membres">
                    <Button
                      label="Voir la liste"
                      icon="pi pi-users"
                      className="rounded-full px-6"
                    />
                  </Link>
                  <Link to="/membres?action=create">
                    <Button
                      label="Ajouter un membre"
                      icon="pi pi-plus"
                      outlined
                      severity="secondary"
                      className="rounded-full px-6"
                    />
                  </Link>
                </>
              ) : isStagiaire ? (
                <>
                  <Link to="/finance">
                    <Button
                      label="Voir mes paiements"
                      icon="pi pi-wallet"
                      className="rounded-full px-6"
                    />
                  </Link>
                  <Link to="/mes-presences">
                    <Button
                      label="Mes présences"
                      icon="pi pi-check-circle"
                      outlined
                      severity="secondary"
                      className="rounded-full px-6"
                    />
                  </Link>
                </>
              ) : canManageFinance ? (
                <Link to="/finance">
                  <Button
                    label="Voir la finance"
                    icon="pi pi-wallet"
                    className="rounded-full px-6"
                  />
                </Link>
              ) : canManageDevoirs ? (
                <Link to="/devoirs">
                  <Button
                    label="Voir les devoirs"
                    icon="pi pi-file-edit"
                    className="rounded-full px-6"
                  />
                </Link>
              ) : canManageAnnonces ? (
                <Link to="/annonces">
                  <Button
                    label="Gérer les annonces"
                    icon="pi pi-megaphone"
                    className="rounded-full px-6"
                  />
                </Link>
              ) : (
                <Link to="/annonces">
                  <Button
                    label="Consulter les annonces"
                    icon="pi pi-megaphone"
                    className="rounded-full px-6"
                  />
                </Link>
              )}
            </div>
          </div>

          <div className="grid min-w-0 gap-3">
            {(canManageFinance || isStagiaire) && (
              <div className="rounded-3xl border border-fongo-200 bg-white/80 p-5 shadow-sm backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fongo-500">
                  {canManageFinance ? 'Total collecté' : 'Mes versements'}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {formatMoney(data.finance.total_collecte)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {data.finance.nombre_paiements} paiement
                  {data.finance.nombre_paiements > 1 ? 's' : ''} enregistré
                  {data.finance.nombre_paiements > 1 ? 's' : ''}.
                </p>
              </div>
            )}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Activité du club
              </p>
              <div className="mt-2 flex items-end gap-4">
                <div>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {data.activite.devoirs}
                  </p>
                  <p className="text-xs text-slate-500">devoirs</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {data.activite.evenements}
                  </p>
                  <p className="text-xs text-slate-500">événements</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900">
                    {data.activite.annonces}
                  </p>
                  <p className="text-xs text-slate-500">annonces</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(isSuperAdmin || canManageFinance) && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isSuperAdmin && (
            <>
              <StatCard
                label="Stagiaires"
                value={data.compteurs.stagiaires}
                hint="Profils enregistrés"
                icon="pi pi-user-plus"
                accent="bg-fongo-50 text-fongo-700"
              />
              <StatCard
                label="Membres"
                value={data.compteurs.membres}
                hint="Tous rôles confondus"
                icon="pi pi-users"
                accent="bg-fongo-100 text-fongo-800"
              />
            </>
          )}
          {canManageFinance && (
            <StatCard
              label="Paiements"
              value={data.finance.nombre_paiements}
              hint="Versements enregistrés"
              icon="pi pi-credit-card"
              accent="bg-emerald-50 text-emerald-600"
            />
          )}
        </section>
      )}

      <section className="grid gap-5">
        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Dernières annonces</h2>
            <Link
              to="/annonces"
              className="text-xs font-semibold text-fongo-700 hover:underline"
            >
              Tout voir
            </Link>
          </div>
          {data.dernieres_annonces.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              Aucune annonce publiée pour le moment.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.dernieres_annonces.map((annonce) => (
                <li
                  key={annonce.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  {annonce.template === 'fongo_expo' ? (
                    /* Affiche FongoExpo rendue sur le dashboard, quelle que
                       soit la nature du compte connecté. */
                    <>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Affiche FongoExpo
                        </span>
                        <span className="break-words text-xs text-slate-500">
                          {annonce.auteur__username} ·{' '}
                          {formatDateTime(annonce.poster_a)}
                        </span>
                      </div>
                      <FongoExpoSession
                        dateInfo={`Prévue le ${formatDateTime(annonce.date_prevue)}`}
                        subTitle={truncateText(annonce.contenu ?? '')}
                        catchphrase={annonce.object}
                        imageFront={annonce.image1}
                        imageBack={annonce.image2}
                      />
                    </>
                  ) : annonce.template === 'visual' ? (
                    <>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Annonce visuelle
                        </span>
                        <span className="break-words text-xs text-slate-500">
                          {annonce.auteur__username} ·{' '}
                          {formatDateTime(annonce.poster_a)}
                        </span>
                      </div>
                      {annonce.image1 ? (
                        <img
                          src={annonce.image1}
                          alt={annonce.object}
                          className="max-h-96 w-full rounded-xl object-contain"
                        />
                      ) : (
                        <p className="text-sm text-slate-500">
                          Image indisponible.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="break-words font-semibold text-slate-800">
                        {annonce.object}
                      </p>
                      <p className="mt-1 break-words text-xs font-medium text-fongo-700">
                        <Icon className="pi pi-calendar mr-1.5" />
                        Prévue le {formatDateTime(annonce.date_prevue)}
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {annonce.auteur__username} ·{' '}
                        {formatDateTime(annonce.poster_a)}
                      </p>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {isSuperAdmin && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900">
            Répartition des membres
          </h2>
          <div className="space-y-4">
            {data.repartition_roles.map((item) => {
              const percent = roleTotal
                ? Math.round((item.nombre / roleTotal) * 100)
                : 0
              return (
                <div key={item.role}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {roleLabel(item.role)}
                    </span>
                    <span className="text-slate-500">
                      {item.nombre} · {percent}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-fongo-700 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
