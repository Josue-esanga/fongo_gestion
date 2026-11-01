import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { describeCameraError, type ScanFailure } from '@/lib/cameraErrors'

export type ScannerPhase = 'starting' | 'scanning' | 'error'

/**
 * Acquisition de la caméra et boucle de décodage du QR code.
 *
 * Le flux est démarré à l'ouverture et arrêté à la fermeture. `retry()`
 * relance l'acquisition après un refus ou une caméra indisponible.
 */
export function useQrScanner({
  visible,
  onCode,
}: {
  visible: boolean
  onCode: (code: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const decodedRef = useRef(false)
  const onCodeRef = useRef(onCode)

  const [phase, setPhase] = useState<ScannerPhase>('starting')
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
    async function attach(
      stream: MediaStream,
    ): Promise<HTMLVideoElement | null> {
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
        if (
          video.readyState < video.HAVE_ENOUGH_DATA ||
          video.videoWidth === 0
        ) {
          return
        }

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

  return { videoRef, canvasRef, phase, failure, noFrames, retry }
}
