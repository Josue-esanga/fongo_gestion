import { Button } from 'primereact/button'
import type { SeancePresence } from '@/types'

export function DayFilter({
  jours,
  total,
  jourActif,
  onChange,
}: {
  jours: Array<{ date: string; label: string; items: SeancePresence[] }>
  total: number
  jourActif: string | null
  onChange: (date: string | null) => void
}) {
  if (jours.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:inline">
        Classement par jour
      </span>
      <Button
        size="small"
        rounded
        label={`Tous les jours (${total})`}
        severity={jourActif === null ? 'info' : 'secondary'}
        outlined={jourActif !== null}
        onClick={() => onChange(null)}
      />
      {jours.map((jour) => (
        <Button
          key={jour.date}
          size="small"
          rounded
          label={`${jour.label} (${jour.items.length})`}
          severity={jourActif === jour.date ? 'info' : 'secondary'}
          outlined={jourActif !== jour.date}
          onClick={() => onChange(jour.date)}
        />
      ))}
    </div>
  )
}
