import { Suspense, useState, type ReactNode } from 'react'
import { Icon } from '@/components/Icon'

function DialogLoading({ label }: { label: string }) {
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/25 px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-2xl">
        <i className="pi pi-spinner pi-spin text-fongo-700" />
        {label}
      </div>
    </div>
  )
}

/**
 * Ne charge le module d'un dialogue qu'à sa première ouverture, puis le
 * conserve monté pour garder les animations de fermeture et l'état du
 * formulaire. Le fallback couvre le temps de téléchargement du chunk.
 */
export function LazyDialogBoundary({
  open,
  children,
  label = 'Chargement du formulaire…',
}: {
  open: boolean
  children: ReactNode
  label?: string
}) {
  const [hasOpened, setHasOpened] = useState(open)

  // Mémorise la première ouverture pour garder le dialogue monté ensuite
  // (animations de fermeture et état du formulaire conservés).
  if (open && !hasOpened) setHasOpened(true)

  if (!open && !hasOpened) return null

  return (
    <Suspense fallback={<DialogLoading label={label} />}>{children}</Suspense>
  )
}
