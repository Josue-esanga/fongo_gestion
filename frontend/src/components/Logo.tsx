import { Link } from 'react-router-dom'

/**
 * Marque FongoGestion affichée dans l'application connectée.
 *
 * Le logo est le même que celui de la page publique, pour une identité
 * cohérente entre la vitrine et l'espace membre.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-3">
      <img
        src="/images/logo.svg"
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl shadow-sm"
        width="40"
        height="40"
      />
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-white">FongoGestion</span>
          <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.12em] text-fongo-200 sm:text-[11px] sm:tracking-[0.18em]">
            Plateforme de gestion
          </span>
        </span>
      )}
    </Link>
  )
}
