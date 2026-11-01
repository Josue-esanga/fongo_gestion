import { useObjectUrl } from '@/lib/useObjectUrl'
import { Icon } from '@/components/Icon'

/** Champ image d'une carte de l'affiche FongoExpo. */
export function AnnonceImageField({
  inputId,
  label,
  hint,
  currentUrl,
  cleared = false,
  file,
  onSelect,
  onRemove,
}: {
  /** Identifiant unique du champ (utilisé pour input et label). */
  inputId: string
  label: string
  hint: string
  /** Image déjà enregistrée en base (édition). */
  currentUrl?: string | null
  /** L'utilisateur a demandé le retrait de l'image en base. */
  cleared?: boolean
  /** Nouveau fichier sélectionné (non encore envoyé). */
  file: File | null
  onSelect: (file: File) => void
  /** Retire la nouvelle image ou marque l'image en base à retirer. */
  onRemove: () => void
}) {
  const objectUrl = useObjectUrl(file)
  const preview = objectUrl ?? (cleared ? null : (currentUrl ?? null))

  const input = (
    <input
      id={inputId}
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(event) => {
        const chosen = event.target.files?.[0]
        if (chosen) onSelect(chosen)
        event.target.value = ''
      }}
    />
  )

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
        preview ? 'border-slate-200' : 'border-dashed border-slate-300'
      }`}
    >
      {preview ? (
        <div className="relative h-32 w-full">
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                {label}
              </p>
              <p className="truncate text-xs font-semibold text-white">
                {file ? file.name : 'Image enregistrée'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={`Remplacer ${label.toLowerCase()}`}
                title="Remplacer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
                onClick={() => document.getElementById(inputId)?.click()}
              >
                <Icon className="pi pi-refresh text-xs" />
              </button>
              <button
                type="button"
                aria-label={`Retirer ${label.toLowerCase()}`}
                title="Retirer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-red-500"
                onClick={onRemove}
              >
                <Icon className="pi pi-trash text-xs" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1 bg-slate-50/70 px-4 text-center transition hover:bg-fongo-50/50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <Icon className="pi pi-image" />
          </span>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          <span className="text-[11px] leading-4 text-slate-400">{hint}</span>
        </label>
      )}
      {input}
    </div>
  )
}
