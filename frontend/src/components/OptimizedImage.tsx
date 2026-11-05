/**
 * Composant d'image optimisé pour WebP / AVIF avec lazy loading.
 *
 * Principe :
 * - Le navigateur choisit le premier format qu'il supporte (AVIF > WebP > fallback)
 * - Lazy loading activé par défaut (sauf si `loading="eager"` est passé)
 * - Décodage asynchrone pour ne pas bloquer le thread principal
 * - Fallback sur l'image originale si AVIF/WebP manquent ou échouent
 *
 * Exemple :
 *   <OptimizedImage
 *     src="/images/photo.jpg"
 *     avifSrc="/images/photo.avif"
 *     webpSrc="/images/photo.webp"
 *     alt="Description"
 *     className="w-full h-auto"
 *   />
 */
type OptimizedImageProps = {
  /** URL de l'image originale (fallback obligatoire) */
  src: string
  /** URL de la version AVIF (meilleure compression, servie en priorité) */
  avifSrc?: string
  /** URL de la version WebP (fallback si AVIF non supporté) */
  webpSrc?: string
  alt: string
  className?: string
  width?: number | string
  height?: number | string
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'sync' | 'auto'
  onError?: () => void
  style?: React.CSSProperties
  /** Quand true, rend un <img> simple sans <picture> (pour les SVG, icônes, etc.) */
  plain?: boolean
} & Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  | 'src'
  | 'alt'
  | 'className'
  | 'width'
  | 'height'
  | 'loading'
  | 'decoding'
  | 'onError'
  | 'style'
>

export function OptimizedImage({
  src,
  avifSrc,
  webpSrc,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  onError,
  style,
  plain = false,
  ...rest
}: OptimizedImageProps) {
  // Le navigateur choisit automatiquement le format supporté dans <picture>.
  // On se contente de propager l'erreur éventuelle au parent.
  const handleError = () => {
    onError?.()
  }

  // Pour les SVG et icônes, on rend un <img> classique (pas besoin de <picture>)
  if (plain || src.endsWith('.svg')) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onError={handleError}
        style={style}
        {...rest}
      />
    )
  }

  return (
    <picture>
      {avifSrc && <source srcSet={avifSrc} type="image/avif" />}
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onError={handleError}
        style={style}
        {...rest}
      />
    </picture>
  )
}
