import { useObjectUrl } from '@/lib/useObjectUrl'
import { Icon } from '@/components/Icon'

/** Sélecteur d'image de couverture avec aperçu de la carte du module. */
export function ModuleImageField({
  inputId,
  currentUrl,
  cleared,
  file,
  onSelect,
  onRemove,
}: {
  inputId: string
  /** Image déjà enregistrée en base (édition). */
  currentUrl?: string | null
  /** L'utilisateur a demandé le retrait de l'image en base. */
  cleared: boolean
  /** Nouveau fichier sélectionné (non encore envoyé). */
  file: File | null
  onSelect: (file: File) => void
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
      className={`relative overflow-hidden rounded-2xl border bg-white ${
        preview ? 'border-slate-200' : 'border-dashed border-slate-300'
      }`}
    >
      {preview ? (
        <div className="relative h-40 w-full">
          <img
            src={preview}
            alt="Aperçu de l'image du module"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {file ? file.name : 'Image enregistrée'}
              </p>
              <p className="text-[10px] text-white/70">
                Aperçu de la carte du module
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-white"
                onClick={() => document.getElementById(inputId)?.click()}
              >
                <Icon className="pi pi-refresh mr-1 text-[10px]" />
                Remplacer
              </button>
              <button
                type="button"
                className="rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-red-600"
                onClick={onRemove}
              >
                <Icon className="pi pi-trash mr-1 text-[10px]" />
                Retirer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-40 cursor-pointer flex-col items-center justify-center gap-1 bg-slate-50/70 px-4 text-center transition hover:bg-fongo-50/50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
            <Icon className="pi pi-image text-base" />
          </span>
          <span className="text-sm font-semibold text-slate-700">
            Ajouter une image
          </span>
          <span className="text-[11px] text-slate-400">
            JPG, PNG ou WebP • format paysage conseillé
          </span>
        </label>
      )}
      {input}
    </div>
  )
}
