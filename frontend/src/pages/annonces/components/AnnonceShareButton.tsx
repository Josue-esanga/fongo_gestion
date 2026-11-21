import { useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { getErrorMessage } from '@/lib/errors'
import { renderAnnonceImage } from '@/lib/annonceShare'
import { AnnonceShareDialog } from './AnnonceShareDialog'
import type { Annonce } from '@/types'

/**
 * Bouton « Partager » : propose WhatsApp (statut ou contacts) et Facebook
 * pour l'annonce, **sous forme d'image**. Visible par tous les utilisateurs,
 * managers ou non, sur la page des annonces comme sur la page d'accueil.
 *
 * Le PNG est généré au clic (aperçu fidèle) puis confié au dialogue.
 */
export function AnnonceShareButton({
  annonce,
  label = 'Partager',
  className = '',
}: {
  annonce: Annonce
  label?: string
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<{
    url: string
    blob: Blob | null
    error: string | null
  } | null>(null)
  const previewRef = useRef<{ url: string; blob: Blob } | null>(null)

  // Libère l'URL d'aperçu quand le bouton disparaît.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current.url)
    },
    [],
  )

  async function openDialog() {
    setGenerating(true)
    try {
      const blob = await renderAnnonceImage(annonce)
      const url = URL.createObjectURL(blob)
      if (previewRef.current) URL.revokeObjectURL(previewRef.current.url)
      previewRef.current = { url, blob }
      setPreview({ url, blob, error: null })
      setVisible(true)
    } catch (cause) {
      // On ouvre quand même : le dialogue affichera l'erreur.
      setPreview({ url: '', blob: null, error: getErrorMessage(cause) })
      setVisible(true)
    } finally {
      setGenerating(false)
    }
  }

  function closeDialog() {
    setVisible(false)
  }

  return (
    <>
      <Button
        type="button"
        label={label}
        icon="pi pi-share-alt"
        size="small"
        rounded
        outlined
        severity="success"
        className={className}
        loading={generating}
        disabled={generating}
        onClick={openDialog}
      />
      <LazyDialogBoundary open={visible} label="Préparation du partage…">
        <AnnonceShareDialog
          visible={visible}
          annonce={annonce}
          previewUrl={preview?.url || null}
          previewBlob={preview?.blob ?? null}
          previewError={preview?.error ?? null}
          onHide={closeDialog}
        />
      </LazyDialogBoundary>
    </>
  )
}
