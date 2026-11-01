import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { configurationApi } from '@/api/dashboard'
import { financeApi, type PaiementPayload } from '@/api/finance'
import { ErrorState } from '@/components/Feedback'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { FinanceSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatMoney } from '@/lib/format'
import { lazyNamed } from '@/lib/lazy'
import type { Paiement, StatutPaiement } from '@/types'
import { FinanceAccessDenied } from './components/FinanceAccessDenied'
import { FinanceReport } from './components/FinanceReport'
import { FinanceStats } from './components/FinanceStats'
import { FinanceTabs } from './components/FinanceTabs'
import { PaymentsTable } from './components/PaymentsTable'
import { StudentsTable } from './components/StudentsTable'
import { FINANCE_TABS, type FinanceTab } from './types'

const PaymentFormDialog = lazyNamed(
  () => import('./PaymentFormDialog'),
  'PaymentFormDialog',
)
const LumicashPayCard = lazyNamed(
  () => import('./LumicashPayCard'),
  'LumicashPayCard',
)

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

  const initialTab = (searchParams.get('tab') as FinanceTab | null) ?? 'payments'
  const [tab, setTab] = useState<FinanceTab>(
    canManageFinance && FINANCE_TABS.some((item) => item.key === initialTab)
      ? initialTab
      : 'payments',
  )

  const visibleTabs = canManageFinance
    ? FINANCE_TABS
    : FINANCE_TABS.filter((item) => item.key === 'payments')

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

  // Validation / refus d'une demande Lumicash (caissier et super admin).
  const statutMutation = useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: StatutPaiement }) =>
      financeApi.setStatut(id, statut),
    onSuccess: async (_paiement, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      await queryClient.invalidateQueries({ queryKey: ['finance-students'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast(
        'success',
        variables.statut === 'valide' ? 'Demande validée' : 'Demande refusée',
        variables.statut === 'valide'
          ? 'Le versement est compté dans les recettes.'
          : 'La demande ne sera pas comptée dans les recettes.',
      )
    },
    onError: (error) =>
      showToast('error', 'Action impossible', getErrorMessage(error)),
  })

  const allPayments = paymentsQuery.data ?? []
  const payments = canManageFinance
    ? allPayments
    : allPayments.filter((payment) => payment.stagiaire.id === user?.id)
  const students = studentsQuery.data ?? []

  // Demandes Lumicash déposées par les stagiaires, en attente de validation.
  const demandesEnAttente = payments.filter(
    (payment) => payment.statut === 'en_attente',
  ).length
  const paiementsValides = payments.filter(
    (payment) => (payment.statut ?? 'valide') === 'valide',
  )

  const totals = useMemo(() => {
    // Seuls les versements validés sont comptés : les demandes Lumicash « en
    // attente » ne sont pas encore encaissées (comme côté API).
    const validees = payments.filter(
      (payment) => (payment.statut ?? 'valide') === 'valide',
    )
    const total = validees.reduce((sum, payment) => sum + payment.montant, 0)
    const moduleTotal = validees
      .filter((payment) => payment.category === 'module')
      .reduce((sum, payment) => sum + payment.montant, 0)
    const autresTotal = total - moduleTotal
    return {
      total,
      moduleTotal,
      autresTotal,
      moyenne: validees.length ? Math.round(total / validees.length) : 0,
    }
  }, [payments])

  function changeTab(next: FinanceTab) {
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

  function changeStatut(payment: Paiement, statut: StatutPaiement) {
    statutMutation.mutate({ id: payment.id, statut })
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

  if (accessRefuse) return <FinanceAccessDenied />

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
              label="Payer par Lumicash"
              icon="pi pi-mobile"
              outlined
              className="rounded-full px-5"
              onClick={() =>
                document
                  .getElementById('lumicash')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            />
          ) : null
        }
      />

      {/* Stagiaire : paiement mobile sur le numéro Lumicash du club. */}
      {isStagiaire && (
        <Suspense
          fallback={
            <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
          }
        >
          <LumicashPayCard />
        </Suspense>
      )}

      {canManageFinance && (
        <FinanceStats
          totals={totals}
          paymentCount={paiementsValides.length}
          studentCount={students.length}
        />
      )}

      <FinanceTabs tabs={visibleTabs} active={tab} onChange={changeTab} />

      {tab === 'payments' && (
        <PaymentsTable
          payments={payments}
          canManage={canManageFinance}
          demandesEnAttente={demandesEnAttente}
          statutPending={statutMutation.isPending}
          onValider={(payment) => changeStatut(payment, 'valide')}
          onRefuser={(payment) => changeStatut(payment, 'refuse')}
          onEdit={(payment) => {
            setEditing(payment)
            setDialogVisible(true)
          }}
          onDelete={confirmDelete}
        />
      )}

      {tab === 'students' && (
        <StudentsTable students={students} target={target} />
      )}

      {tab === 'report' && (
        <FinanceReport totals={totals} students={students} target={target} />
      )}

      <LazyDialogBoundary open={dialogVisible}>
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
      </LazyDialogBoundary>
    </div>
  )
}
