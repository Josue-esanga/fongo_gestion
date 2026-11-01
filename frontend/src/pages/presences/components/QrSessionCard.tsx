import { Tag } from 'primereact/tag'
import { QRCodeSVG } from 'qrcode.react'
import { formatDateTime } from '@/lib/format'
import type { SeancePresence } from '@/types'
import { Icon } from '@/components/Icon'

export function QrSessionCard({
  seance,
  presents,
  absents,
  total,
}: {
  seance: SeancePresence
  presents: number
  absents: number
  total: number
}) {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fongo-500">
            {seance.ouverte ? 'Appel en cours' : 'Appel clôturé'}
          </p>
          <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
            {seance.libelle}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(seance.created_at)}
            {seance.creee_par_nom ? ` · ${seance.creee_par_nom}` : ''}
          </p>
        </div>
        <Tag
          severity={seance.ouverte ? 'success' : 'secondary'}
          value={seance.ouverte ? 'Ouvert' : 'Fermé'}
        />
      </div>

      {seance.ouverte ? (
        <>
          <div className="flex justify-center rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
            {/* Mobile : le QR code occupe toute la largeur de son bloc ;
                à partir de `sm`, il reprend sa taille fixe centrée. */}
            <div className="w-full rounded-2xl bg-white p-2 shadow-sm sm:w-auto sm:p-3">
              <QRCodeSVG
                value={seance.qr_payload}
                size={200}
                level="M"
                aria-label="QR code de présence"
                className="h-auto w-full"
              />
            </div>
          </div>
          <p className="text-center text-sm leading-6 text-slate-600">
            Affichez ce QR code en salle. Chaque stagiaire le scanne depuis
            l'application :{' '}
            <span className="font-semibold text-slate-800">
              Tableau de bord → Ma présence → Scanner le QR
            </span>
            .
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <Icon className="pi pi-ban text-xl" />
          </span>
          <p className="max-w-xs text-sm text-slate-500">
            Cet appel est terminé : son QR code n'est plus valable. Démarrez un
            nouvel appel pour continuer le pointage.
          </p>
        </div>
      )}

      {/* min-w-0 sur chaque cellule : les libellés (mot « Stagiaires »
          non cassable) ne peuvent plus élargir la grille au-delà de
          l'écran — c'est ce qui créait un défilement horizontal. */}
      <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="min-w-0 rounded-2xl bg-emerald-50 p-2 sm:p-3">
          <p className="text-lg font-extrabold text-emerald-600 sm:text-xl">
            {presents}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-600/80 sm:text-[11px]">
            Présents
          </p>
        </div>
        <div className="min-w-0 rounded-2xl bg-red-50 p-2 sm:p-3">
          <p className="text-lg font-extrabold text-red-600 sm:text-xl">
            {absents}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-red-600/80 sm:text-[11px]">
            Absents
          </p>
        </div>
        <div className="min-w-0 rounded-2xl bg-slate-100 p-2 sm:p-3">
          <p className="text-lg font-extrabold text-slate-700 sm:text-xl">
            {total}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
            Stagiaires
          </p>
        </div>
      </div>
    </section>
  )
}
