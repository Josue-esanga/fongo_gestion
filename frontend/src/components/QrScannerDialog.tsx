import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useQrScanner } from '@/hooks/useQrScanner'
import { Icon } from '@/components/Icon'

/**
 * Scan du QR code de présence (côté stagiaire) : la caméra est indispensable,
 * il n'existe aucune saisie manuelle de secours.
 *
 * - l'accès caméra est demandé dès l'ouverture (prompt du navigateur) ;
 * - en cas de refus : message précis + bouton « Autoriser la caméra » ;
 * - chaque ouverture réinitialise le scanner (via un `key` côté appelant).
 */
export function QrScannerDialog({
  visible,
  onHide,
  onCode,
}: {
  visible: boolean
  onHide: () => void
  onCode: (code: string) => void
}) {
  const { videoRef, canvasRef, phase, failure, noFrames, retry } =
    useQrScanner({ visible, onCode })

  return (
    <Dialog
      header="Scanner le QR code de présence"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      style={{ width: 'min(94vw, 520px)' }}
      footer={
        <div className="flex justify-end">
          <Button
            label="Fermer"
            icon="pi pi-times"
            severity="secondary"
            text
            onClick={onHide}
          />
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <div className="relative min-h-64 overflow-hidden rounded-3xl bg-slate-950">
          {phase !== 'error' && (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`h-64 w-full object-cover ${
                phase === 'scanning' ? '' : 'opacity-0'
              }`}
            />
          )}

          {phase === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <ProgressSpinner
                style={{ width: '42px', height: '42px' }}
                strokeWidth="4"
                animationDuration="1s"
              />
              <p className="text-sm font-semibold text-white">
                Ouverture de la caméra…
              </p>
              <p className="text-xs text-white/70">
                Autorisez la caméra dans la fenêtre du navigateur.
              </p>
            </div>
          )}

          {phase === 'scanning' && (
            <>
              <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400/90" />
              <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-4 pb-3 pt-8 text-center text-xs font-medium text-white">
                Placez le QR code affiché en salle dans le cadre
              </p>
            </>
          )}

          {phase === 'error' && failure && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                <Icon className="pi pi-camera text-xl" />
              </span>
              <p className="text-sm font-semibold text-white">
                {failure.message}
              </p>
              {failure.hint && (
                <p className="max-w-sm text-xs leading-5 text-white/70">
                  {failure.hint}
                </p>
              )}
              <Button
                label="Autoriser la caméra"
                icon="pi pi-camera"
                className="mt-1 rounded-full px-5"
                onClick={retry}
              />
              <p className="text-[11px] text-white/50">
                Le scan se fait uniquement avec la caméra.
              </p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {phase === 'scanning' && noFrames && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            La caméra est ouverte mais aucune image n'arrive (une autre
            application l'utilise probablement). Fermez-la, puis cliquez sur
            « Actualiser la caméra ».
          </div>
        )}

        {phase === 'scanning' && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Icon className="pi pi-sync animate-spin text-emerald-600" />
              Recherche du QR code…
            </span>
            <button
              type="button"
              className="font-semibold text-fongo-700 hover:underline"
              onClick={retry}
            >
              Actualiser la caméra
            </button>
          </div>
        )}

        {phase === 'scanning' && (
          <p className="text-center text-xs text-slate-500">
            Aucune saisie manuelle : si rien ne se passe, vérifiez que la caméra
            est autorisée pour ce site (icône cadenas).
          </p>
        )}
      </div>
    </Dialog>
  )
}
