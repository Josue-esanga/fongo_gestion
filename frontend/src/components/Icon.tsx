/**
 * Icône accessible pour FongoGestion.
 *
 * Les icônes PrimeIcons (`<i className="pi pi-...">`) sont purement décoratives.
 * Elles doivent être masquées aux lecteurs d'écran via `aria-hidden="true"` pour
 * éviter qu'elles ne soient lues comme du texte incompréhensible.
 *
 * @example <Icon className="pi pi-home" />
 * @example <Icon className="pi pi-users text-lg" />
 */
export function Icon({
  className,
  ...props
}: {
  className?: string
  [key: string]: any
}) {
  return <i aria-hidden="true" className={className} {...props} />
}
