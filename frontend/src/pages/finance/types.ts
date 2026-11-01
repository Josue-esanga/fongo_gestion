export type FinanceTab = 'payments' | 'students' | 'report'

export interface FinanceTotals {
  total: number
  moduleTotal: number
  autresTotal: number
  moyenne: number
}

export const FINANCE_TABS: Array<{
  key: FinanceTab
  label: string
  icon: string
}> = [
  { key: 'payments', label: 'Historique des paiements', icon: 'pi pi-list' },
  { key: 'students', label: 'Liste des stagiaires', icon: 'pi pi-users' },
  { key: 'report', label: 'Rapport cumulatif', icon: 'pi pi-chart-bar' },
]
