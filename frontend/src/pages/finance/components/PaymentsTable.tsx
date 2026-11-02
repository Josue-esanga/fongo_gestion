import { Button } from 'primereact/button'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { EmptyState } from '@/components/Feedback'
import { UserAvatar } from '@/components/UserAvatar'
import { Icon } from '@/components/Icon'
import { formatDateTime, formatMoney } from '@/lib/format'
import type { Paiement } from '@/types'

export function PaymentsTable({
  payments,
  canManage,
  demandesEnAttente,
  statutPending,
  onValider,
  onRefuser,
  onEdit,
  onDelete,
}: {
  payments: Paiement[]
  canManage: boolean
  demandesEnAttente: number
  statutPending: boolean
  onValider: (payment: Paiement) => void
  onRefuser: (payment: Paiement) => void
  onEdit: (payment: Paiement) => void
  onDelete: (payment: Paiement) => void
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {canManage && demandesEnAttente > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700">
          <Icon className="pi pi-hourglass" />
          {demandesEnAttente} demande
          {demandesEnAttente > 1 ? 's' : ''} de paiement Lumicash en attente de
          validation.
        </div>
      )}

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
              canManage
                ? 'Ajoutez un premier versement pour suivre la trésorerie.'
                : 'Aucun versement ne vous concerne pour le moment.'
            }
          />
        }
        scrollable
        tableStyle={{ minWidth: canManage ? '68rem' : '54rem' }}
        className="text-sm"
      >
        {canManage && (
          <Column
            header="Stagiaire"
            body={(payment: Paiement) => {
              const stagiaire = payment.stagiaire ?? null
              return (
                <div className="flex items-center gap-3">
                  {stagiaire ? (
                    <>
                      <UserAvatar user={stagiaire} />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {stagiaire.full_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          @{stagiaire.username}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-900">
                        Stagiaire inconnu
                      </p>
                    </div>
                  )}
                </div>
              )
            }}
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
          header="Module / catégorie"
          body={(payment: Paiement) =>
            payment.category === 'module' ? (
              <div className="flex flex-col items-start gap-1">
                <Tag value="Module" severity="info" />
                <span className="text-xs font-medium text-slate-600">
                  {payment.module_titre ?? 'Module non précisé'}
                </span>
              </div>
            ) : (
              <Tag value="Autres frais" severity="secondary" />
            )
          }
        />
        <Column header="Description" field="description" />
        <Column
          header="Statut"
          body={(payment: Paiement) => {
            const statut = payment.statut ?? 'valide'
            const severity =
              statut === 'valide'
                ? 'success'
                : statut === 'en_attente'
                  ? 'warning'
                  : 'danger'
            return (
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag
                  value={payment.statut_display ?? statut}
                  severity={severity}
                />
                {payment.moyen === 'lumicash' && (
                  <Tag value="Lumicash" severity="info" />
                )}
              </div>
            )
          }}
        />
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
        {canManage && (
          <Column
            header="Actions"
            frozen
            alignFrozen="right"
            body={(payment: Paiement) => {
              // Demande Lumicash en attente : on valide ou on refuse.
              if (payment.statut === 'en_attente') {
                return (
                  <div className="flex items-center gap-1">
                    <Button
                      icon="pi pi-check"
                      rounded
                      text
                      severity="success"
                      aria-label="Valider la demande de paiement"
                      loading={statutPending}
                      onClick={() => onValider(payment)}
                    />
                    <Button
                      icon="pi pi-times"
                      rounded
                      text
                      severity="danger"
                      aria-label="Refuser la demande de paiement"
                      loading={statutPending}
                      onClick={() => onRefuser(payment)}
                    />
                  </div>
                )
              }
              return (
                <div className="flex items-center gap-1">
                  <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    aria-label="Modifier le paiement"
                    onClick={() => onEdit(payment)}
                  />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    aria-label="Supprimer le paiement"
                    onClick={() => onDelete(payment)}
                  />
                </div>
              )
            }}
          />
        )}
      </DataTable>
    </div>
  )
}
