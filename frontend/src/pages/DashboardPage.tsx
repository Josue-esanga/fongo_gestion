import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { dashboardApi } from '@/api/dashboard'
import { ErrorState } from '@/components/Feedback'
import { DashboardSkeleton } from '@/components/Skeletons'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, formatMoney, roleLabel, rolesLabel } from '@/lib/format'
import { MaPresenceCard } from '@/pages/presences/MaPresenceCard'

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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 break-words text-3xl font-extrabold leading-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${accent}`}
        >
          <i className={icon} />
        </span>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, can, isSuperAdmin, isStagiaire } = useAuth()
  const canManageFinance = can('finance')
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  })

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

  return (
    <div className="space-y-7 animate-fade-in-up">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50 p-6 shadow-sm sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-fongo-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-fongo-900">
              Tableau de bord
            </span>
            <h1 className="text-balance text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Bonjour{' '}
              <span className="text-fongo-700">{data.utilisateur.full_name}</span>,
              bienvenue sur FongoGestion
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {isSuperAdmin
                ? "Gérez vos stagiaires, vos finances et l'ensemble des activités du comité FongoLab avec une interface claire et moderne."
                : 'Consultez vos paiements, vos devoirs, le planning et les annonces du club FongoLab en toute simplicité.'}
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
              ) : canManageFinance || isStagiaire ? (
                <Link to="/finance">
                  <Button
                    label={
                      isStagiaire ? 'Voir mes paiements' : 'Voir la finance'
                    }
                    icon="pi pi-wallet"
                    className="rounded-full px-6"
                  />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            {(canManageFinance || isStagiaire) && (
              <div className="rounded-3xl border border-blue-200 bg-white/80 p-5 shadow-sm backdrop-blur">
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

      {/* Stagiaire : statut de présence + scan du QR code d'appel. */}
      {isStagiaire && <MaPresenceCard />}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isSuperAdmin && (
          <>
            <StatCard
              label="Stagiaires"
              value={data.compteurs.stagiaires}
              hint="Profils enregistrés"
              icon="pi pi-user-plus"
              accent="bg-blue-50 text-fongo-700"
            />
            <StatCard
              label="Membres"
              value={data.compteurs.membres}
              hint="Tous rôles confondus"
              icon="pi pi-users"
              accent="bg-indigo-50 text-indigo-600"
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
        <StatCard
          label="Mon rôle"
          value={rolesLabel(user?.role, user?.roles_supplementaires)}
          hint={user?.email || 'Compte FongoGestion'}
          icon="pi pi-shield"
          accent="bg-amber-50 text-amber-600"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  <p className="font-semibold text-slate-800">{annonce.object}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {annonce.auteur__username} · {formatDateTime(annonce.poster_a)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Prochains événements</h2>
            {isSuperAdmin && (
              <Link
                to="/planning"
                className="text-xs font-semibold text-fongo-700 hover:underline"
              >
                Gérer
              </Link>
            )}
          </div>
          {data.prochains_evenements.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              Aucun événement planifié.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.prochains_evenements.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(event.date)} · {event.dirigent__username}
                    </p>
                  </div>
                  <Tag value="À venir" severity="info" />
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
