import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { LazyDialogBoundary } from '@/components/common/LazyDialogBoundary'
import { getErrorMessage } from '@/lib/errors'
import { captureAnnonceCard } from '@/lib/annonceCapture'
import { annoncesApi } from '@/api/annonces'
import { AnnonceShareDialog } from './AnnonceShareDialog'
import type { Annonce } from '@/types'

/**
 * Bouton « Partager » : image du rendu publié + lien public de l'annonce,
 * pour WhatsApp et Facebook. Visible par tous les utilisateurs, sur la page
 * des annonces comme sur la page d'accueil.
 *
 * La capture de la carte est prise au clic (aperçu fidèle) puis déposée comme
 * « poster » : le lien partagé a toujours la même image que celle téléchargée,
 * même si une ancienne image (avec les boutons) avait été publiée.
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
  const queryClient = useQueryClient()
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
      const blob = await captureAnnonceCard(annonce.id)
      if (blob) {
        const url = URL.createObjectURL(blob)
        if (previewRef.current) URL.revokeObjectURL(previewRef.current.url)
        previewRef.current = { url, blob }
        setPreview({ url, blob, error: null })

        // La capture devient le « poster » de l'annonce : elle remplace
        // l'ancienne image (y compris une image publiée avant la correction
        // des boutons) et sert d'aperçu au lien partagé. On attend ce dépôt
        // (borné pour ne jamais bloquer l'ouverture du lien) afin que la page
        // publique affiche déjà la bonne image quand WhatsApp ou Facebook la
        // lit.
        const depot = annoncesApi
          .uploadPoster(annonce.id, blob)
          .then((maj) => {
            queryClient.setQueriesData<Annonce[]>(
              { queryKey: ['annonces'] },
              (old) =>
                Array.isArray(old)
                  ? old.map((a) => (a.id === maj.id ? maj : a))
                  : old,
            )
          })
          .catch(() => undefined)
        await Promise.race([
          depot,
          new Promise((resolve) => setTimeout(resolve, 2500)),
        ])
      } else {
        setPreview({
          url: '',
          blob: null,
          error:
            "La carte de l'annonce n'est pas affichée ici : le partage se fera avec le seul lien.",
        })
      }
      setVisible(true)
    } catch (cause) {
      setPreview({ url: '', blob: null, error: getErrorMessage(cause) })
      setVisible(true)
    } finally {
      setGenerating(false)
    }
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
          onHide={() => setVisible(false)}
        />
      </LazyDialogBoundary>
    </>
  )
}
