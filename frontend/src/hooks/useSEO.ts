import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { updateSEO, getSEOForPath } from '@/lib/seo'

/**
 * Met à jour automatiquement les balises SEO (<title>, meta description,
 * Open Graph…) selon la route courante.
 *
 * À placer dans chaque page (ou dans le Layout) pour que chaque URL ait son
 * propre titre et sa propre description.
 *
 * @example
 *   useSEO() // lit le pathname courant via react-router-dom
 */
export function useSEO() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = getSEOForPath(pathname)
    updateSEO(seo)
  }, [pathname])
}
