import { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Icon } from '@/components/Icon'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { truncateText } from '@/lib/format'
import {
  annoncePublicUrl,
  copyAnnonceLink,
  downloadAnnonceImage,
  shareAnnonce,
  shareTargetLabel,
  type ShareOutcome,
  type ShareTarget,
} from '@/lib/annonceShare'
import type { Annonce } from '@/types'

/**
 * Dialogue de partage d'une annonce : **image + lien**.
 *
 * - L'image est la capture du rendu affiché (aucun design ajouté ni retiré) ;
 * - le lien ouvre la page publique de l'annonce, dont WhatsApp / Facebook
 *   affichent l'aperçu (image + titre) grâce aux balises Open Graph ;
 * - sur mobile, l'image et le lien partent ensemble via le partage natif,
 *   sans téléchargement manuel.
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
  /** PNG du rendu affiché, déjà capturé à l'ouverture. */
  previewUrl: string | null
  previewBlob: Blob | null
  previewError: string | null
  onHide: () => void
}) {
  const { showToast } = useToast()
  const [working, setWorking] = useState<ShareTarget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<{
    outcome: ShareOutcome
    target: ShareTarget
  } | null>(null)

  const url = annoncePublicUrl(annonce.id)
  const busy = working !== null

  async function handleShare(target: ShareTarget) {
    setWorking(target)
    setError(null)
    setResult(null)
    setCopied(false)
    try {
      const outcome = await shareAnnonce(annonce, previewBlob, target)
      setResult({ outcome, target })
      if (outcome === 'shared') {
        showToast('success', `Partagé sur ${shareTargetLabel(target)}`)
      } else if (outcome === 'link') {
        showToast(
          'info',
          `${shareTargetLabel(target)} ouvert`,
          "Le lien de l'annonce est prêt à être publié.",
        )
      }
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      setWorking(null)
    }
  }

  function handleDownload() {
    if (!previewBlob) return
    downloadAnnonceImage(previewBlob, annonce)
    showToast('success', 'Image téléchargée', 'Le PNG correspond au rendu affiché.')
  }

  async function handleCopy() {
    const ok = await copyAnnonceLink(annonce)
    setCopied(ok)
    showToast(
      ok ? 'success' : 'error',
      ok ? 'Lien copié' : 'Copie impossible',
      ok ? url : 'Copiez-le manuellement depuis le champ.',
    )
  }

  const header = (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fongo-100 text-fongo-900 shadow-sm">
        <Icon className="pi pi-share-alt text-lg" />
      </span>
      <div>
        <p className="text-base font-bold text-slate-900">Partager l'annonce</p>
        <p className="text-xs text-slate-500">
          L'image du rendu et le lien de l'annonce partent ensemble.
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
      style={{ width: 'min(96vw, 780px)' }}
    >
      <div className="grid gap-5 pt-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Image : capture du rendu affiché, sans modification */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Image de l'annonce : ${truncateText(annonce.object, 60)}`}
              className="max-h-[420px] w-full object-contain"
            />
          ) : (
            <div
              className="flex aspect-square w-full items-center justify-center gap-2 px-4 text-center text-sm text-slate-500"
              role="status"
              aria-live="polite"
            >
              <Icon className="pi pi-info-circle" />
              Image indisponible : le partage se fera avec le seul lien.
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Rendu publié
          </span>
        </div>

        {/* Actions de partage */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">
            {truncateText(annonce.object, 70)}
          </p>

          {/* Lien public de l'annonce (retour au dashboard) */}
          <div>
            <label
              htmlFor="lien-annonce"
              className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400"
            >
              Lien de l'annonce
            </label>
            <div className="flex gap-2">
              <input
                id="lien-annonce"
                value={url}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              />
              <Button
                type="button"
                icon={copied ? 'pi pi-check' : 'pi pi-copy'}
                label={copied ? 'Copié' : 'Copier'}
                size="small"
                outlined
                severity={copied ? 'success' : 'secondary'}
                onClick={handleCopy}
              />
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">
              Ce lien ouvre l'annonce puis renvoie vers le dashboard.
            </p>
          </div>

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
            disabled={busy || !previewBlob}
            onClick={handleDownload}
          />

          {result?.outcome === 'link' && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
              <p className="flex items-start gap-2">
                <Icon className="pi pi-info-circle mt-0.5" />
                <span>
                  {shareTargetLabel(result.target)} s'ouvre avec le lien de
                  l'annonce : l'image et le titre s'y affichent automatiquement,
                  sur le statut comme dans une conversation.
                </span>
              </p>
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
