import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { ProgressSpinner } from 'primereact/progressspinner'
import jsQR from 'jsqr'

type Phase = 'starting' | 'scanning' | 'error'

interface ScanFailure {
  message: string
  hint?: string
}

/** Traduit une erreur d'accès caméra en message actionnable (pas de secours). */
function describeCameraError(error: unknown): ScanFailure {
  const name =
    typeof error === 'object' && error && 'name' in error
      ? String((error as { name: unknown }).name)
      : ''

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return {
        message: "Le navigateur refuse l'accès à la caméra.",
        hint:
          window.self !== window.top
            ? "Cette page est intégrée dans un autre site (iframe) : la caméra y est bloquée. Ouvrez l'application directement dans un onglet (nouvelle fenêtre du navigateur), autorisez la caméra, puis réessayez."
            : "Cliquez sur l'icône cadenas / caméra de la barre d'adresse, autorisez la Caméra pour ce site, puis réessayez.",
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        message: "Aucune caméra n'a été trouvée sur cet appareil.",
        hint: 'Branchez ou activez une caméra (ou autorisez-la pour ce site), puis réessayez.',
      }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        message: 'La caméra est déjà utilisée par une autre application.',
        hint: 'Fermez les visioconférences ou autres applications qui utilisent la caméra, puis réessayez.',
      }
    case 'OverconstrainedError':
      return {
        message: 'Aucune caméra compatible détectée.',
        hint: 'Réessayez : le scan utilise n’importe quelle caméra disponible.',
      }
    default:
      return {
        message: "Impossible d'activer la caméra.",
        hint: error instanceof Error ? error.message : undefined,
      }
  }
}

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const decodedRef = useRef(false)
  const onCodeRef = useRef(onCode)

  const [phase, setPhase] = useState<Phase>('starting')
  const [failure, setFailure] = useState<ScanFailure | null>(null)
  // Caméra ouverte mais aucune image reçue après quelques secondes.
  const [noFrames, setNoFrames] = useState(false)
  // Renouvelé par « Autoriser la caméra » : relance l'acquisition.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    onCodeRef.current = onCode
  }, [onCode])

  const emit = useCallback((code: string) => {
    if (decodedRef.current) return
    decodedRef.current = true
    onCodeRef.current(code)
  }, [])

  // Acquisition de la caméra + boucle de décodage (démarrage à l'ouverture,
  // arrêt à la fermeture ou au changement de tentative).
  useEffect(() => {
    if (!visible) return undefined

    decodedRef.current = false
    let cancelled = false
    let lastDecode = 0

    const stopStream = () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    const fail = (details: ScanFailure) => {
      stopStream()
      if (cancelled) return
      setFailure(details)
      setPhase('error')
    }

    // Démarre avec la caméra arrière, puis retombe sur n'importe laquelle.
    async function acquire(): Promise<MediaStream> {
      const attempts: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        { video: true, audio: false },
      ]

      let lastError: unknown = new Error('Aucune caméra.')
      for (const constraints of attempts) {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints)
        } catch (error) {
          lastError = error
          const name =
            typeof error === 'object' && error && 'name' in error
              ? String((error as { name: unknown }).name)
              : ''
          // Refus explicite : réessayer avec d'autres contraintes ne change rien.
          if (
            name === 'NotAllowedError' ||
            name === 'PermissionDeniedError' ||
            name === 'SecurityError'
          ) {
            throw error
          }
        }
      }
      throw lastError
    }

    // Attache le flux à la <video> (attendu dans le rendu au moment de l'effet).
    async function attach(stream: MediaStream): Promise<HTMLVideoElement | null> {
      for (let i = 0; i < 40 && !cancelled; i += 1) {
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          return video
        }
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      return null
    }

    function scheduleDecode() {
      if (cancelled || decodedRef.current) return
      // On re-planifie AVANT de traiter : une exception ne tue pas la boucle.
      rafRef.current = requestAnimationFrame(scheduleDecode)

      const now = performance.now()
      if (now - lastDecode < 50) return // ~20 images/s suffisent
      lastDecode = now

      try {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return
        if (video.readyState < video.HAVE_ENOUGH_DATA || video.videoWidth === 0) return

        // Réduction à 720 px de large : décodage plus rapide et plus fiable.
        const scale = Math.min(1, 720 / video.videoWidth)
        const width = Math.max(1, Math.round(video.videoWidth * scale))
        const height = Math.max(1, Math.round(video.videoHeight * scale))
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return
        context.drawImage(video, 0, 0, width, height)

        const frame = context.getImageData(0, 0, width, height)
        const found = jsQR(frame.data, width, height, {
          inversionAttempts: 'attemptBoth',
        })
        if (found?.data) {
          emit(found.data)
          stopStream()
        }
      } catch {
        // Image momentanément illisible : on continue à la frame suivante.
      }
    }

    async function run() {
      // Laisse l'effet se terminer avant le premier setState.
      await new Promise((resolve) => setTimeout(resolve, 0))
      if (cancelled) return

      if (!navigator.mediaDevices?.getUserMedia) {
        fail({
          message: "La caméra n'est pas accessible sur cette page.",
          hint: `Contexte non sécurisé ou intégré (${window.location.origin}) : le navigateur n'autorise la caméra qu'en HTTPS ou sur localhost. Ouvrez l'application dans un onglet dédié en https:// ou http://localhost. Le scan exige la caméra, aucune saisie manuelle n'est prévue.`,
        })
        return
      }

      let stream: MediaStream
      try {
        stream = await acquire()
      } catch (error) {
        fail(describeCameraError(error))
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream

      const video = await attach(stream)
      if (cancelled) return
      if (!video) {
        fail({
          message: "Impossible d'afficher le flux de la caméra.",
          hint: 'Fermez puis rouvrez le scanner pour réessayer.',
        })
        return
      }

      try {
        // Plafonné : si play() reste bloqué (flux absent), on passe quand même
        // en mode scan — la boucle attendra les premières images.
        await Promise.race([
          video.play(),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ])
      } catch {
        // Lecture automatique refusée : la boucle démarrera dès les premières images.
      }
      if (cancelled) return

      setPhase('scanning')
      scheduleDecode()
    }

    void run()

    return () => {
      cancelled = true
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      // Le flux est stoppé ; React détache la <video> à la fermeture ou au
      // changement de phase (le prochain raccord écrase srcObject).
      stopStream()
    }
  }, [visible, attempt, emit])

  // La caméra est ouverte mais aucune image n'arrive : on le signale
  // (souvent une autre application qui détient déjà la caméra).
  useEffect(() => {
    if (phase !== 'scanning') return undefined
    const timer = setTimeout(() => {
      const video = videoRef.current
      if (!video || video.videoWidth === 0) setNoFrames(true)
    }, 8000)
    return () => clearTimeout(timer)
  }, [phase, attempt])

  function retry() {
    setFailure(null)
    setNoFrames(false)
    setPhase('starting')
    setAttempt((current) => current + 1)
  }

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
                <i className="pi pi-camera text-xl" />
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
              <i className="pi pi-sync animate-spin text-emerald-600" />
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
            Aucune saisie manuelle : si rien ne se passe, vérifiez que la
            caméra est autorisée pour ce site (icône cadenas).
          </p>
        )}
      </div>
    </Dialog>
  )
}
