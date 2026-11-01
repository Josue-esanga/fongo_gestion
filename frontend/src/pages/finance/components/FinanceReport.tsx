import { formatMoney } from '@/lib/format'
import type { StagiaireFinance } from '@/types'
import type { FinanceTotals } from '../types'

export function FinanceReport({
  totals,
  students,
  target,
}: {
  totals: FinanceTotals
  students: StagiaireFinance[]
  target: number
}) {
  const aJour = students.filter(
    (student) => student.total_paye >= target,
  ).length
  const partiels = students.filter(
    (student) => student.total_paye > 0 && student.total_paye < target,
  ).length
  const enRetard = students.filter(
    (student) => student.total_paye === 0,
  ).length

  return (
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
              {aJour}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
            <span className="text-sm font-medium text-slate-700">
              Paiements partiels
            </span>
            <span className="text-lg font-extrabold text-emerald-600">
              {partiels}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4">
            <span className="text-sm font-medium text-slate-700">En retard</span>
            <span className="text-lg font-extrabold text-red-600">
              {enRetard}
            </span>
          </div>
          <p className="pt-2 text-xs leading-5 text-slate-400">
            Objectif de cotisation configuré : {formatMoney(target)}. Modifiable
            depuis l'administration Django.
          </p>
        </div>
      </div>
    </div>
  )
}
