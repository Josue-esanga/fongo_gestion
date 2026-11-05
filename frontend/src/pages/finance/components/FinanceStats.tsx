import { formatMoney } from '@/lib/format'
import type { FinanceTotals } from '../types'
import { Icon } from '@/components/Icon'

export function FinanceStats({
  totals,
  paymentCount,
  studentCount,
}: {
  totals: FinanceTotals
  paymentCount: number
  studentCount: number
}) {
  const items = [
    {
      label: 'Total collecté',
      value: formatMoney(totals.total),
      icon: 'pi pi-wallet',
      accent: 'bg-fongo-50 text-fongo-700',
    },
    {
      label: 'Paiements',
      value: paymentCount,
      icon: 'pi pi-receipt',
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Stagiaires',
      value: studentCount,
      icon: 'pi pi-users',
      accent: 'bg-fongo-100 text-fongo-800',
    },
    {
      label: 'Paiement moyen',
      value: formatMoney(totals.moyenne),
      icon: 'pi pi-chart-line',
      accent: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
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
              <Icon className={item.icon} />
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
