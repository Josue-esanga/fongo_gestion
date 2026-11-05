import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from 'react'

/**
 * Fait apparaître son contenu en douceur lorsqu'il entre dans le viewport.
 *
 * L'animation est désactivée automatiquement si l'utilisateur a demandé de
 * réduire les animations (`prefers-reduced-motion`) ou si le navigateur ne
 * supporte pas `IntersectionObserver`.
 *
 * @example
 *   <Reveal delay={120}><section>…</section></Reveal>
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  /** Délai en millisecondes, utile pour un effet en cascade. */
  delay?: number
  /** Balise HTML à rendre (div par défaut). */
  as?: ElementType
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
