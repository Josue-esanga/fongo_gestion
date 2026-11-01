import dayjs from 'dayjs'
import { Tag } from 'primereact/tag'
import { FongoExpoSession } from '@/components/FongoExpoSession'
import {
  annonceCibleLabel,
  annonceCibleSeverity,
  truncateText,
} from '@/lib/format'
import type { AnnonceCible, AnnonceTemplate } from '@/types'
import { Icon } from '@/components/Icon'

export function AnnoncePreview({
  template,
  cible,
  dateValue,
  objectValue,
  contenuValue,
  image1Preview,
  image2Preview,
}: {
  template: AnnonceTemplate
  cible: AnnonceCible
  dateValue: Date | undefined
  objectValue: string | undefined
  contenuValue: string | undefined
  image1Preview: string | null
  image2Preview: string | null
}) {
  const previewDate = dateValue
    ? dayjs(dateValue).format('DD/MM/YYYY [à] HH:mm')
    : 'Date à définir'
  const dateInfo = dateValue
    ? `Prévue le ${previewDate}`
    : 'Date à définir'
  const safeContent = contenuValue?.trim() ?? ''
  const previewExcerpt = safeContent
    ? truncateText(safeContent, 220)
    : "Le contenu de votre annonce apparaîtra ici."
  const posterSubtitle = safeContent
    ? truncateText(safeContent, 170)
    : "Le contenu de votre annonce apparaîtra ici."
  const previewObject = objectValue?.trim() || "Objet de l'annonce"
  const posterCatchphrase =
    objectValue?.trim() || 'Votre annonce FongoExpo'

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-fongo-700 shadow-sm">
            <Icon className="pi pi-eye text-xs" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Aperçu en direct
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm">
          {template === 'fongo_expo' ? 'Affiche' : 'Carte'}
        </span>
      </div>

      {template === 'fongo_expo' ? (
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <FongoExpoSession
            dateInfo={dateInfo}
            subTitle={posterSubtitle}
            catchphrase={posterCatchphrase}
            imageFront={image1Preview}
            imageBack={image2Preview}
            minHeight="min-h-[450px]"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Tag
              value={annonceCibleLabel(cible)}
              severity={annonceCibleSeverity(cible)}
            />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Icon className="pi pi-calendar text-[10px]" />
              {previewDate}
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">
            {previewObject}
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {previewExcerpt}
          </p>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <Icon className="pi pi-user text-[10px]" />
            Publié par l'équipe du club
          </div>
        </div>
      )}

      <p className="mt-3 px-1 text-[11px] leading-5 text-slate-400">
        L'aperçu reprend le contenu saisi ; le rendu final peut varier selon
        l'écran.
      </p>
    </div>
  )
}
