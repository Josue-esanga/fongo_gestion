/**
 * Trois points animés, dans l'esprit du loader de Facebook Messenger.
 *
 * Le composant ne fixe ni couleur ni taille : il hérite de `currentColor` et
 * de la taille de police du parent (`em`), ce qui permet de l'utiliser aussi
 * bien dans une petite pastille que sur un grand écran de démarrage.
 *
 * @example
 *   <LoaderDots className="text-4xl text-cyan-300" />
 */
export function LoaderDots({ className = '' }: { className?: string }) {
  return (
    <span className={`loader-dots ${className}`.trim()} aria-hidden="true">
      <span className="loader-dot" />
      <span className="loader-dot" />
      <span className="loader-dot" />
    </span>
  )
}
