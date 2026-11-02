import { useEffect, useState } from 'react'

/**
 * Splash screen simple affiché au démarrage de l'application.
 * Affiche le logo fongolab.png puis s'efface automatiquement.
 */
export function SplashScreen({
  delay = 1500, // ms avant de disparaître
  onFinish,
}: { delay?: number; onFinish?: () => void } = {}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onFinish?.()
    }, delay)
    return () => clearTimeout(t)
  }, [delay, onFinish])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#03045e] text-white transition-opacity duration-500"
      aria-label="Chargement de FongoGestion"
      role="status"
    >
      <div className="relative">
        <img
          src="/images/fongolab.jpg"
          alt="Logo FongoLab"
          className="w-32 h-32 md:w-40 md:h-40 rounded-full drop-shadow-lg animate-pulse"
          loading="eager"
        />
        {/* Anneau décoratif animé autour du logo */}
        <div className="absolute inset-0 rounded-full border border-white/30 animate-spin"></div>
      </div>
      <div className="mt-6 text-sm font-medium tracking-wide uppercase">
        FongoLab
      </div>
      <div className="mt-2 text-xs text-fongo-200/90 animate-bounce">
        Chargement…
      </div>
    </div>
  )
}
