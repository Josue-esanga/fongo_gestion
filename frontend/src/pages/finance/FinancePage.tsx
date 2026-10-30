import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { confirmDialog } from 'primereact/confirmdialog'
import { configurationApi } from '@/api/dashboard'
import { financeApi, type PaiementPayload } from '@/api/finance'
import { EmptyState, ErrorState } from '@/components/Feedback'
import { FinanceSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatDateTime, formatMoney } from '@/lib/format'
import type { Paiement, StagiaireFinance } from '@/types'
import { PaymentFormDialog } from './PaymentFormDialog'

type Tab = 'payments' | 'students' | 'report'

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'payments', label: 'Historique des paiements', icon: 'pi pi-list' },
  { key: 'students', label: 'Liste des stagiaires', icon: 'pi pi-users' },
  { key: 'report', label: 'Rapport cumulatif', icon: 'pi pi-chart-bar' },
]

function studentStatus(total: number, target: number) {
  if (total >= target) return { label: 'Complet', severity: 'info' as const }
  if (total > 0) return { label: 'À jour', severity: 'success' as const }
  return { label: 'En retard', severity: 'danger' as const }
}

export function FinancePage() {
  const { user, can, isStagiaire, isAuthenticated } = useAuth()
  // Le CRUD finance est réservé au super admin et aux admins caissiers.
  const canManageFinance = can('finance')
  // Un admin sans le rôle caissier n'a aucun accès à cette section.
  const accessRefuse = !canManageFinance && !isStagiaire
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<Paiement | null>(null)

  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'payments'
  const [tab, setTab] = useState<Tab>(
    canManageFinance && TABS.some((item) => item.key === initialTab) ? initialTab : 'payments',
  )

  const visibleTabs = canManageFinance ? TABS : TABS.filter((item) => item.key === 'payments')

  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: () => financeApi.payments(),
  })

  const studentsQuery = useQuery({
    queryKey: ['finance-students'],
    queryFn: financeApi.students,
    enabled: canManageFinance,
  })

  const configurationQuery = useQuery({
    queryKey: ['configuration'],
    queryFn: configurationApi.get,
    enabled: canManageFinance,
  })

  const target = configurationQuery.data?.frais_formation ?? 150_000

  const createMutation = useMutation({
    mutationFn: (payload: PaiementPayload) => financeApi.createPayment(payload),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PaiementPayload }) =>
      financeApi.updatePayment(id, payload),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeApi.removePayment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] })
      void queryClient.invalidateQueries({ queryKey: ['finance-students'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Paiement supprimé', 'Le versement a été retiré.')
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  const allPayments = paymentsQuery.data ?? []
  const payments = canManageFinance
    ? allPayments
    : allPayments.filter((payment) => payment.stagiaire.id === user?.id)
  const students = studentsQuery.data ?? []

  const totals = useMemo(() => {
    const total = payments.reduce((sum, payment) => sum + payment.montant, 0)
    const moduleTotal = payments
      .filter((payment) => payment.category === 'module')
      .reduce((sum, payment) => sum + payment.montant, 0)
    const autresTotal = total - moduleTotal
    return {
      total,
      moduleTotal,
      autresTotal,
      moyenne: payments.length ? Math.round(total / payments.length) : 0,
    }
  }, [payments])

  function changeTab(next: Tab) {
    if (!canManageFinance && next !== 'payments') return
    setTab(next)
    setSearchParams(next === 'payments' ? {} : { tab: next }, { replace: true })
  }

  async function handleSubmit(payload: PaiementPayload) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Paiement modifié', 'Le versement a été mis à jour.')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Paiement ajouté', 'Le versement a été enregistré.')
      }
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      await queryClient.invalidateQueries({ queryKey: ['finance-students'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDialogVisible(false)
      setEditing(null)
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
    }
  }

  function confirmDelete(payment: Paiement) {
    confirmDialog({
      header: 'Supprimer le paiement',
      message: `Supprimer le paiement de ${formatMoney(payment.montant)} pour ${payment.stagiaire.full_name} ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deleteMutation.mutate(payment.id),
    })
  }

  if (paymentsQuery.isLoading || studentsQuery.isLoading) {
    return <FinanceSkeleton />
  }

  if (paymentsQuery.isError || studentsQuery.isError) {
    const queryError = paymentsQuery.error ?? studentsQuery.error
    return (
      <ErrorState
        title="Données financières indisponibles"
        description={getErrorMessage(queryError)}
        onRetry={() => {
          void paymentsQuery.refetch()
          void studentsQuery.refetch()
        }}
        retrying={paymentsQuery.isFetching || studentsQuery.isFetching}
      />
    )
  }

  if (accessRefuse) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <PageHeader
          eyebrow="Gestion financière"
          title="Finance"
          subtitle="Suivez les versements des stagiaires, analysez les recettes et gardez une vision claire de la trésorerie du club."
        />
        <EmptyState
          icon="pi pi-lock"
          title="Accès réservé"
          description="La section Finance est réservée aux caissiers et au super administrateur. Demandez le rôle caissier pour y accéder."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Gestion financière"
        title="Finance"
        subtitle="Suivez les versements des stagiaires, analysez les recettes et gardez une vision claire de la trésorerie du club."
        actions={
          canManageFinance ? (
            <Button
              label="Ajouter un paiement"
              icon="pi pi-plus"
              className="rounded-full px-5"
              onClick={() => {
                setEditing(null)
                setDialogVisible(true)
              }}
            />
          ) : isAuthenticated ? (
            <Button
              label="Payer en ligne"
              icon="pi pi-credit-card"
              outlined
              className="rounded-full px-5"
              onClick={() =>
                showToast(
                  'info',
                  'Bientôt disponible',
                  'Le paiement en ligne sera activé prochainement. Contactez un administrateur pour le moment.',
                )
              }
            />
          ) : null
        }
      />

      {canManageFinance && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
          {
            label: 'Total collecté',
            value: formatMoney(totals.total),
            icon: 'pi pi-wallet',
            accent: 'bg-blue-50 text-fongo-700',
          },
          {
            label: 'Paiements',
            value: payments.length,
            icon: 'pi pi-receipt',
            accent: 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Stagiaires',
            value: students.length,
            icon: 'pi pi-users',
            accent: 'bg-indigo-50 text-indigo-600',
          },
          {
            label: 'Paiement moyen',
            value: formatMoney(totals.moyenne),
            icon: 'pi pi-chart-line',
            accent: 'bg-amber-50 text-amber-600',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-extrabold text-slate-900">
                  {item.value}
                </p>
              </div>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${item.accent}`}
              >
                <i className={item.icon} />
              </span>
            </div>
          </div>
        ))}
      </section>
      )}

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {visibleTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => changeTab(item.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? 'bg-fongo-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className={`${item.icon} text-xs`} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            value={payments}
            dataKey="id"
            paginator
            rows={8}
            rowsPerPageOptions={[8, 16, 32]}
            emptyMessage={
              <EmptyState
                icon="pi pi-wallet"
                title="Aucun paiement enregistré"
                description={
                  canManageFinance
                    ? 'Ajoutez un premier versement pour suivre la trésorerie.'
                    : 'Aucun versement ne vous concerne pour le moment.'
                }
              />
            }
            scrollable
            tableStyle={{ minWidth: canManageFinance ? '58rem' : '42rem' }}
            className="text-sm"
          >
            {canManageFinance && (
              <Column
                header="Stagiaire"
                body={(payment: Paiement) => (
                  <div className="flex items-center gap-3">
                    <UserAvatar user={payment.stagiaire} />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {payment.stagiaire.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        @{payment.stagiaire.username}
                      </p>
                    </div>
                  </div>
                )}
              />
            )}
            <Column
              header="Montant"
              sortable
              sortField="montant"
              body={(payment: Paiement) => (
                <span className="font-bold text-fongo-700">
                  {formatMoney(payment.montant)}
                </span>
              )}
            />
            <Column
              header="Catégorie"
              body={(payment: Paiement) => (
                <Tag
                  value={payment.category === 'module' ? 'Module' : 'Autres'}
                  severity={payment.category === 'module' ? 'info' : 'secondary'}
                />
              )}
            />
            <Column header="Description" field="description" />
            <Column
              header="Date"
              sortable
              sortField="created_at"
              body={(payment: Paiement) => (
                <span className="text-sm text-slate-500">
                  {formatDateTime(payment.created_at)}
                </span>
              )}
            />
            {canManageFinance && (
              <Column
                header="Actions"
                frozen
                alignFrozen="right"
                body={(payment: Paiement) => (
                  <div className="flex items-center gap-1">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      severity="info"
                      aria-label="Modifier le paiement"
                      onClick={() => {
                        setEditing(payment)
                        setDialogVisible(true)
                      }}
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      aria-label="Supprimer le paiement"
                      onClick={() => confirmDelete(payment)}
                    />
                  </div>
                )}
              />
            )}
          </DataTable>
        </div>
      )}

      {tab === 'students' && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            value={students}
            dataKey="id"
            paginator
            rows={8}
            rowsPerPageOptions={[8, 16, 32]}
            emptyMessage={
              <EmptyState
                icon="pi pi-users"
                title="Aucun stagiaire"
                description="Aucun profil stagiaire n'est disponible."
              />
            }
            scrollable
            tableStyle={{ minWidth: '48rem' }}
            className="text-sm"
          >
            <Column
              header="Stagiaire"
              body={(student: StagiaireFinance) => (
                <div className="flex items-center gap-3">
                  <UserAvatar user={student} />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {student.email || "Pas d'email"}
                    </p>
                  </div>
                </div>
              )}
            />
            <Column
              header="Total versé"
              sortable
              sortField="total_paye"
              body={(student: StagiaireFinance) => (
                <span className="font-bold text-fongo-700">
                  {formatMoney(student.total_paye)}
                </span>
              )}
            />
            <Column
              header="Dernier versement"
              body={(student: StagiaireFinance) => (
                <span className="text-sm text-slate-500">
                  {student.dernier_paiement
                    ? formatDate(student.dernier_paiement)
                    : 'Aucun'}
                </span>
              )}
            />
            <Column
              header="Progression"
              body={(student: StagiaireFinance) => {
                const percent = Math.min(
                  100,
                  Math.round((student.total_paye / target) * 100),
                )
                return (
                  <div className="w-40">
                    <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                      <span>{percent}%</span>
                      <span>{formatMoney(target)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-fongo-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              }}
            />
            <Column
              header="Statut"
              body={(student: StagiaireFinance) => {
                const status = studentStatus(student.total_paye, target)
                return <Tag value={status.label} severity={status.severity} />
              }}
            />
          </DataTable>
        </div>
      )}

      {tab === 'report' && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Répartition des recettes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ventilation des paiements par catégorie.
            </p>
            <div className="mt-6 space-y-5">
              {[
                {
                  label: 'Modules de formation',
                  value: totals.moduleTotal,
                  color: 'bg-fongo-700',
                },
                {
                  label: 'Autres frais',
                  value: totals.autresTotal,
                  color: 'bg-[#3385c7]',
                },
              ].map((item) => {
                const percent = totals.total
                  ? Math.round((item.value / totals.total) * 100)
                  : 0
                return (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                      <span className="text-slate-500">
                        {formatMoney(item.value)} · {percent}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Total général
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {formatMoney(totals.total)}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Situation du club</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">
                <span className="text-sm font-medium text-slate-700">
                  Stagiaires à jour
                </span>
                <span className="text-lg font-extrabold text-fongo-700">
                  {
                    students.filter((student) => student.total_paye >= target)
                      .length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
                <span className="text-sm font-medium text-slate-700">
                  Paiements partiels
                </span>
                <span className="text-lg font-extrabold text-emerald-600">
                  {
                    students.filter(
                      (student) =>
                        student.total_paye > 0 && student.total_paye < target,
                    ).length
                  }
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4">
                <span className="text-sm font-medium text-slate-700">
                  En retard
                </span>
                <span className="text-lg font-extrabold text-red-600">
                  {students.filter((student) => student.total_paye === 0).length}
                </span>
              </div>
              <p className="pt-2 text-xs leading-5 text-slate-400">
                Objectif de cotisation configuré : {formatMoney(target)}. Modifiable
                depuis l'administration Django.
              </p>
            </div>
          </div>
        </div>
      )}

      <PaymentFormDialog
        visible={dialogVisible}
        payment={editing}
        stagiaires={students}
        saving={createMutation.isPending || updateMutation.isPending}
        onHide={() => {
          setDialogVisible(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
