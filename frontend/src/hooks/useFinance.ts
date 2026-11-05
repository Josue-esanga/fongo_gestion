import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { configurationApi } from '@/api/dashboard'
import { financeApi, type PaiementPayload } from '@/api/finance'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatMoney } from '@/lib/format'
import { FINANCE_TABS, type FinanceTab } from '@/pages/finance/types'
import type { Paiement, StatutPaiement } from '@/types'

/**
 * Hook dédié à la gestion financière.
 * Encapsule : paiements, étudiants, configuration, totaux, mutations CRUD.
 *
 * Le composant appelant reste responsable de :
 * - L'affichage (FinanceStats, FinanceTabs, PaymentsTable, etc.)
 * - Le contrôle d'accès (FinanceAccessDenied)
 * - Le chargement lazy du LumicashPayCard
 */
export function useFinance() {
  const { user, can, isStagiaire, isAuthenticated } = useAuth()
  const canManageFinance = can('finance')
  const accessRefuse = !canManageFinance && !isStagiaire
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState<Paiement | null>(null)

  const requestedTab = searchParams.get('tab')
  const initialTab: FinanceTab =
    requestedTab === 'students' || requestedTab === 'report'
      ? requestedTab
      : 'payments'
  const [tab, setTab] = useState<FinanceTab>(
    canManageFinance ? initialTab : 'payments',
  )

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

  const demandesEnAttente = payments.filter(
    (payment) => payment.statut === 'en_attente',
  ).length
  const paiementsValides = payments.filter(
    (payment) => (payment.statut ?? 'valide') === 'valide',
  )

  const totals = useMemo(() => {
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
    setSearchParams(
      next === 'payments' ? {} : { tab: next },
      { replace: true },
    )
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
      throw error
    }
  }

  function deletePayment(id: number) {
    deleteMutation.mutate(id)
  }

  function changeStatut(id: number, statut: StatutPaiement) {
    statutMutation.mutate({ id, statut })
  }

  function openCreate() {
    setEditing(null)
    setDialogVisible(true)
  }

  function openEdit(payment: Paiement) {
    setEditing(payment)
    setDialogVisible(true)
  }

  const isLoading = paymentsQuery.isLoading || studentsQuery.isLoading
  const isError = paymentsQuery.isError || studentsQuery.isError
  const error = paymentsQuery.error ?? studentsQuery.error
  const isFetching = paymentsQuery.isFetching || studentsQuery.isFetching

  return {
    // Données
    payments,
    students,
    target,
    totaux: totals,
    demandesEnAttente,
    paiementsValides,
    visibleTabs: canManageFinance
      ? FINANCE_TABS
      : FINANCE_TABS.filter((item) => item.key === 'payments'),
    // État
    isLoading,
    isError,
    error,
    isFetching,
    accessRefuse,
    canManageFinance,
    isStagiaire,
    isAuthenticated,
    // UI
    tab,
    setTab,
    dialogVisible,
    setDialogVisible,
    editing,
    setEditing,
    // Actions
    changeTab,
    handleSubmit,
    deletePayment,
    changeStatut,
    openCreate,
    openEdit,
    // Mutations (exposées si besoin au composant)
    statutMutation,
    deleteMutation,
    createMutation,
    updateMutation,
    // Helpers
    formatMoney,
  }
}
