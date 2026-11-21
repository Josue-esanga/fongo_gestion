import { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Icon } from '@/components/Icon'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { truncateText } from '@/lib/format'
import {
  downloadAnnonceImage,
  openSharePlatform,
  shareAnnonceImage,
  shareTargetLabel,
  type ShareResult,
  type ShareTarget,
} from '@/lib/annonceShare'
import type { Annonce } from '@/types'

/**
 * Dialogue de partage d'une annonce **en image** (PNG généré côté navigateur).
 *
 * - WhatsApp / Facebook : la plateforme reçoit le PNG (API Web Share), jamais
 *   du texte ni du code d'annonce ;
 * - sans partage natif : le PNG est téléchargé et l'utilisateur ouvre la
 *   plateforme d'un clic (aucune popup bloquée).
 *
 * L'aperçu est produit par le bouton avant l'ouverture : le PNG affiché est
 * exactement celui qui sera partagé.
 */
export function AnnonceShareDialog({
  visible,
  annonce,
  previewUrl,
  previewBlob,
  previewError,
  onHide,
}: {
  visible: boolean
  annonce: Annonce
  /** PNG déjà généré (aperçu), ou `null` si la génération a échoué. */
  previewUrl: string | null
  previewBlob: Blob | null
  previewError: string | null
  onHide: () => void
}) {
  const { showToast } = useToast()
  const [working, setWorking] = useState<ShareTarget | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    kind: ShareResult
    target: ShareTarget
  } | null>(null)

  async function handleShare(target: ShareTarget) {
    setWorking(target)
    setError(null)
    setResult(null)
    try {
      // Le PNG de l'aperçu est réutilisé : l'image partagée est celle vue.
      const { result: kind } = await shareAnnonceImage(
        annonce,
        previewBlob ?? undefined,
      )
      setResult({ kind, target })
      if (kind === 'shared') {
        showToast('success', `Partagé sur ${shareTargetLabel(target)}`)
      } else if (kind === 'downloaded') {
        showToast(
          'info',
          'Image téléchargée',
          `Ouvrez ${shareTargetLabel(target)} pour la publier.`,
        )
      }
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setWorking(null)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    setError(null)
    try {
      await downloadAnnonceImage(annonce, previewBlob ?? undefined)
      showToast('success', 'Image téléchargée', 'Le PNG est prêt à être partagé.')
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setDownloading(false)
    }
  }

  const busy = working !== null || downloading
  const downloaded = result?.kind === 'downloaded'

  const header = (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fongo-100 text-fongo-900 shadow-sm">
        <Icon className="pi pi-share-alt text-lg" />
      </span>
      <div>
        <p className="text-base font-bold text-slate-900">Partager l'annonce</p>
        <p className="text-xs text-slate-500">
          L'annonce part sous forme d'image, jamais en texte.
        </p>
      </div>
    </div>
  )

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        label="Fermer"
        icon="pi pi-times"
        severity="secondary"
        text
        onClick={onHide}
        disabled={busy}
      />
    </div>
  )

  return (
    <Dialog
      header={header}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(96vw, 760px)' }}
    >
      <div className="grid gap-5 pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Aperçu de l'image qui sera partagée */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Aperçu de l'image : ${truncateText(annonce.object, 60)}`}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div
              className="flex aspect-square w-full items-center justify-center px-4 text-center text-sm text-slate-500"
              role="status"
              aria-live="polite"
            >
              <Icon className="pi pi-exclamation-circle" />
              Aperçu indisponible
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            PNG · 1080 × 1080
          </span>
        </div>

        {/* Actions de partage */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">
            {truncateText(annonce.object, 70)}
          </p>
          <p className="text-xs leading-5 text-slate-500">
            Choisissez où publier l'image : votre statut WhatsApp, un contact
            ou Facebook.
          </p>

          <Button
            type="button"
            label="Partager sur WhatsApp"
            icon="pi pi-whatsapp"
            severity="success"
            className="w-full justify-start"
            loading={working === 'whatsapp'}
            disabled={busy}
            onClick={() => handleShare('whatsapp')}
          />
          <Button
            type="button"
            label="Partager sur Facebook"
            icon="pi pi-facebook"
            severity="info"
            className="w-full justify-start"
            loading={working === 'facebook'}
            disabled={busy}
            onClick={() => handleShare('facebook')}
          />
          <Button
            type="button"
            label="Télécharger l'image"
            icon="pi pi-download"
            outlined
            severity="secondary"
            className="w-full justify-start"
            loading={downloading}
            disabled={busy}
            onClick={handleDownload}
          />

          {downloaded && result && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
              <p className="flex items-start gap-2">
                <Icon className="pi pi-info-circle mt-0.5" />
                <span>
                  L'image a été téléchargée. Ouvrez{' '}
                  {shareTargetLabel(result.target)} puis joignez-la à votre
                  statut ou à votre publication.
                </span>
              </p>
              <Button
                type="button"
                label={`Ouvrir ${shareTargetLabel(result.target)}`}
                icon="pi pi-external-link"
                size="small"
                severity="info"
                text
                className="mt-1 px-0"
                onClick={() => openSharePlatform(result.target)}
              />
            </div>
          )}

          {(previewError ?? error) && (
            <p className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              <Icon className="pi pi-exclamation-circle mt-0.5" />
              {previewError ?? error}
            </p>
          )}
        </div>
      </div>
    </Dialog>
  )
}
