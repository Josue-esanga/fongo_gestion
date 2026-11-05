import { useEffect, useRef, useState } from 'react'
import { LoaderDots } from '@/components/LoaderDots'
import { OptimizedImage } from '@/components/OptimizedImage'

/**
 * Écran de démarrage de l'application.
 *
 * Affiche le logo du projet puis s'efface en douceur. Le chargement est
 * matérialisé par trois points animés, dans l'esprit du loader de Facebook
 * Messenger : discret, lisible et sans rebondissement du texte.
 */
export function SplashScreen({
  delay = 1200, // ms avant de commencer l'effacement
  onFinish,
}: { delay?: number; onFinish?: () => void } = {}) {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    // Laisse le temps au fondu de sortie de se terminer avant de démonter.
    const fadeTimer = setTimeout(() => setLeaving(true), delay)
    const closeTimer = setTimeout(() => {
      setVisible(false)
      onFinishRef.current?.()
    }, delay + 300)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(closeTimer)
    }
  }, [delay])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-fongo-950 text-white transition-opacity duration-300 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Chargement de FongoGestion"
    >
      {/* Halos décoratifs très discrets, alignés sur la palette du projet. */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-fongo-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative">
          <span
            className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/25 via-fongo-500/15 to-transparent blur-2xl"
            aria-hidden
          />
          <OptimizedImage
            src="/images/logo.svg"
            alt=""
            className="h-24 w-24 rounded-[1.75rem] shadow-2xl shadow-fongo-950/60 ring-1 ring-white/15 sm:h-28 sm:w-28"
            width={112}
            height={112}
            loading="eager"
            plain
          />
        </div>

        <p className="mt-7 text-2xl font-extrabold tracking-tight text-white">
          FongoGestion
        </p>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-fongo-300">
          Plateforme du club FongoLab
        </p>

        <div className="mt-9 flex h-10 items-center justify-center">
          <LoaderDots className="text-4xl text-cyan-300" />
        </div>
      </div>
    </div>
  )
}
