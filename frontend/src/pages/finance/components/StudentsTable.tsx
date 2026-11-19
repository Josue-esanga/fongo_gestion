import { useMemo, useState } from 'react'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { EmptyState } from '@/components/Feedback'
import { UserAvatar } from '@/components/UserAvatar'
import { formatDate, formatMoney } from '@/lib/format'
import type { RoleSupplementaire, StagiaireFinance } from '@/types'

/** Filtre d'équipe : chaque équipe se consulte de son côté. */
type EquipeFiltre = 'tous' | 'frontend' | 'backend' | 'sans'

const FILTRES: Array<{ key: EquipeFiltre; label: string }> = [
  { key: 'tous', label: 'Tous' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'sans', label: 'Sans équipe' },
]

function studentStatus(total: number, target: number) {
  if (total >= target) return { label: 'Complet', severity: 'info' as const }
  if (total > 0) return { label: 'À jour', severity: 'success' as const }
  return { label: 'En retard', severity: 'danger' as const }
}

/** Équipes du stagiaire : « frontend » et/ou « backend », sinon aucune. */
function equipesDe(student: StagiaireFinance): RoleSupplementaire[] {
  const extras = student.roles_supplementaires ?? []
  return (['frontend', 'backend'] as const).filter((equipe) =>
    extras.includes(equipe),
  )
}

function correspond(student: StagiaireFinance, filtre: EquipeFiltre): boolean {
  const equipes = equipesDe(student)
  if (filtre === 'tous') return true
  if (filtre === 'sans') return equipes.length === 0
  return equipes.includes(filtre)
}

export function StudentsTable({
  students,
  target,
}: {
  students: StagiaireFinance[]
  target: number
}) {
  const [filtre, setFiltre] = useState<EquipeFiltre>('tous')

  // Compteurs par équipe : un stagiaire peut cumuler frontend + backend.
  const comptes = useMemo(() => {
    const compte: Record<EquipeFiltre, number> = {
      tous: students.length,
      frontend: 0,
      backend: 0,
      sans: 0,
    }
    for (const student of students) {
      const equipes = equipesDe(student)
      if (equipes.includes('frontend')) compte.frontend += 1
      if (equipes.includes('backend')) compte.backend += 1
      if (equipes.length === 0) compte.sans += 1
    }
    return compte
  }, [students])

  const visibles = useMemo(
    () => students.filter((student) => correspond(student, filtre)),
    [students, filtre],
  )

  return (
    <div className="space-y-4">
      {/* Aperçu par équipe : liste les stagiaires frontend et backend séparément. */}
      <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="mr-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Équipe
        </span>
        {FILTRES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFiltre(option.key)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filtre === option.key
                ? 'bg-fongo-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {option.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                filtre === option.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {comptes[option.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          value={visibles}
          dataKey="id"
          paginator
          rows={8}
          rowsPerPageOptions={[8, 16, 32]}
          emptyMessage={
            <EmptyState
              icon="pi pi-users"
              title={
                filtre === 'tous'
                  ? 'Aucun stagiaire'
                  : 'Aucun stagiaire dans cette équipe'
              }
              description={
                filtre === 'tous'
                  ? "Aucun profil stagiaire n'est disponible."
                  : "Aucun profil stagiaire ne correspond à ce filtre d'équipe."
              }
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
                </div>
              </div>
            )}
          />
          <Column
            header="Équipe"
            body={(student: StagiaireFinance) => {
              const equipes = equipesDe(student)
              if (equipes.length === 0) {
                return <Tag value="Sans équipe" severity="secondary" />
              }
              return (
                <div className="flex flex-wrap gap-1">
                  {equipes.includes('frontend') && (
                    <Tag value="Frontend" severity="info" />
                  )}
                  {equipes.includes('backend') && (
                    <Tag value="Backend" severity="warning" />
                  )}
                </div>
              )
            }}
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
    </div>
  )
}
