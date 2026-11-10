import { useEffect, useRef, useState } from 'react'

/**
 * Compteur animé : affiche 0 puis incrémente jusqu'à la valeur finale
 * dès que l'élément entre dans le viewport (une seule fois).
 *
 * - Respecte `prefers-reduced-motion` (valeur finale immédiate)
 * - Fallback sans `IntersectionObserver` : valeur finale immédiate
 * - Annonce la valeur finale aux lecteurs d'écran (`sr-only`),
 *   l'animation reste décorative (`aria-hidden`)
 *
 * @example
 *   <CountUp value="100%" />   // 0 → 100%
 *   <CountUp value="6" />      // 0 → 6
 */
export function CountUp({
  value,
  duration = 1600,
  className = '',
}: {
  /** Valeur à animer, suffixe compris (ex. « 6 », « 100% ») */
  value: string
  /** Durée de l'animation en millisecondes */
  duration?: number
  className?: string
}) {
  const match = /^(\d+)(.*)$/.exec(value.trim())
  const target = match ? Number(match[1]) : 0
  const suffix = match ? match[2] : ''

  // Déterminé pendant le rendu : aucun `setState` synchrone dans l'effet.
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const canAnimate =
    typeof IntersectionObserver !== 'undefined' &&
    typeof requestAnimationFrame !== 'undefined' &&
    typeof performance !== 'undefined' &&
    !prefersReducedMotion

  const [display, setDisplay] = useState(() => (canAnimate ? 0 : target))
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !canAnimate) return

    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.unobserve(entry.target)

        const start = performance.now()
        const tick = (now: number) => {
          // Le timestamp rAF peut précéder `start` : on borne la progression.
          const progress = Math.min(1, Math.max(0, (now - start) / duration))
          // easeOutCubic : rapide au début, freinage doux à la fin
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.round(target * eased))
          if (progress < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.25 },
    )

    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, duration, canAnimate])

  if (!match) return <span className={className}>{value}</span>

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular-nums">
        {display}
        {suffix}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  )
}
