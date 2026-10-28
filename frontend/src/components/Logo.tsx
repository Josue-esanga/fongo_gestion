import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-fongo-900 shadow-sm">
        FG
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-white">FongoGestion</span>
          <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.12em] text-blue-200 sm:text-[11px] sm:tracking-[0.18em]">
            Plateforme de gestion
          </span>
        </span>
      )}
    </Link>
  )
}
