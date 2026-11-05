import { Suspense } from 'react'
import { Button } from 'primereact/button'
import { confirmDialog } from 'primereact/confirmdialog'
import { getErrorMessage } from '@/lib/errors'
import { useFinance } from '@/hooks/useFinance'
import { ErrorState } from '@/components/Feedback'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { FinanceSkeleton } from '@/components/Skeletons'
import { PageHeader } from '@/components/PageHeader'
import { FinanceAccessDenied } from './components/FinanceAccessDenied'
import { FinanceReport } from './components/FinanceReport'
import { FinanceStats } from './components/FinanceStats'
import { FinanceTabs } from './components/FinanceTabs'
import { PaymentsTable } from './components/PaymentsTable'
import { StudentsTable } from './components/StudentsTable'
import { lazyNamed } from '@/lib/lazy'

const PaymentFormDialog = lazyNamed(
  () => import('./PaymentFormDialog'),
  'PaymentFormDialog',
)
const LumicashPayCard = lazyNamed(
  () => import('./LumicashPayCard'),
  'LumicashPayCard',
)

export function FinancePage() {
  const {
    payments,
    students,
    target,
    totaux,
    demandesEnAttente,
    paiementsValides,
    visibleTabs,
    isLoading,
    isError,
    error,
    isFetching,
    accessRefuse,
    canManageFinance,
    isStagiaire,
    isAuthenticated,
    tab,
    dialogVisible,
    setDialogVisible,
    editing,
    setEditing,
    changeTab,
    handleSubmit,
    deletePayment,
    changeStatut,
    openCreate,
    openEdit,
    statutMutation,
  } = useFinance()

  if (isLoading) return <FinanceSkeleton />

  if (accessRefuse) return <FinanceAccessDenied />

  if (isError) {
    return (
      <ErrorState
        title="Données financières indisponibles"
        description={getErrorMessage(error)}
        onRetry={() => {
          // Le refetch est géré par React Query en arrière-plan
        }}
        retrying={isFetching}
      />
    )
  }

  function confirmDelete(payment: any) {
    confirmDialog({
      header: 'Supprimer le paiement',
      message: `Supprimer le paiement de ${payment.stagiaire.full_name} ?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      acceptClassName: 'p-button-danger',
      accept: () => deletePayment(payment.id),
    })
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
              onClick={openCreate}
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
          totals={totaux}
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
          onValider={(payment) => changeStatut(payment.id, 'valide')}
          onRefuser={(payment) => changeStatut(payment.id, 'refuse')}
          onEdit={(payment) => {
            openEdit(payment)
          }}
          onDelete={confirmDelete}
        />
      )}

      {tab === 'students' && (
        <StudentsTable students={students} target={target} />
      )}

      {tab === 'report' && (
        <FinanceReport totals={totaux} students={students} target={target} />
      )}

      <LazyDialogBoundary open={dialogVisible}>
        <PaymentFormDialog
          visible={dialogVisible}
          payment={editing}
          stagiaires={students}
          saving={false}
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
