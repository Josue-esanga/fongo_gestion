import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { EmptyState } from '@/components/Feedback'
import { UserAvatar } from '@/components/UserAvatar'
import { formatDate, formatMoney } from '@/lib/format'
import type { StagiaireFinance } from '@/types'

function studentStatus(total: number, target: number) {
  if (total >= target) return { label: 'Complet', severity: 'info' as const }
  if (total > 0) return { label: 'À jour', severity: 'success' as const }
  return { label: 'En retard', severity: 'danger' as const }
}

export function StudentsTable({
  students,
  target,
}: {
  students: StagiaireFinance[]
  target: number
}) {
  return (
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
            // Garde contre une cible à 0 (évite la division par zéro).
            const safeTarget = target || 1
            const percent = Math.min(
              100,
              Math.round((student.total_paye / safeTarget) * 100),
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
  )
}
