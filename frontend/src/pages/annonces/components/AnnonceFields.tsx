import {
  Controller,
  type Control,
  type FieldErrors,
} from 'react-hook-form'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { FieldError } from '@/components/forms/FieldError'
import { Icon } from '@/components/Icon'
import type { Annonce, AnnonceCible, AnnonceTemplate } from '@/types'
import { AnnonceImageField } from './AnnonceImageField'
import {
  CIBLE_OPTIONS,
  TEMPLATE_OPTIONS,
  type AnnonceFormValues,
} from './annonceFormConfig'

export function AnnonceFields({
  annonce,
  control,
  errors,
  contenuLength,
  template,
  image1File,
  image2File,
  image1Clear,
  image2Clear,
  onSelectImage1,
  onSelectImage2,
  onRemoveImage1,
  onRemoveImage2,
}: {
  annonce: Annonce | null
  control: Control<AnnonceFormValues>
  errors: FieldErrors<AnnonceFormValues>
  contenuLength: number
  template: AnnonceTemplate
  image1File: File | null
  image2File: File | null
  image1Clear: boolean
  image2Clear: boolean
  onSelectImage1: (file: File) => void
  onSelectImage2: (file: File) => void
  onRemoveImage1: () => void
  onRemoveImage2: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="annonce-object"
          className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700"
        >
          <Icon className="pi pi-megaphone text-xs text-fongo-500" />
          Objet de l'annonce
        </label>
        <Controller
          control={control}
          name="object"
          render={({ field }) => (
            <InputText
              id="annonce-object"
              {...field}
              placeholder="Ex. Réunion générale du club"
              className={`w-full ${errors.object ? 'p-invalid' : ''}`}
            />
          )}
        />
        <FieldError message={errors.object?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="annonce-cible"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Public visé
          </label>
          <Controller
            control={control}
            name="cible"
            render={({ field }) => (
              <Dropdown
                inputId="annonce-cible"
                value={field.value}
                options={CIBLE_OPTIONS}
                optionLabel="label"
                optionValue="value"
                placeholder="Choisir le public visé"
                onChange={(event) =>
                  field.onChange((event.value as AnnonceCible) ?? 'tous')
                }
                className={`w-full ${errors.cible ? 'p-invalid' : ''}`}
              />
            )}
          />
          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            Les annonces « administrateurs » sont masquées aux stagiaires.
          </p>
          <FieldError message={errors.cible?.message} />
        </div>

        <div>
          <label
            htmlFor="annonce-date"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Date et heure
          </label>
          <Controller
            control={control}
            name="date_prevue"
            render={({ field }) => (
              <Calendar
                inputId="annonce-date"
                value={field.value}
                onChange={(event) => field.onChange(event.value ?? new Date())}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                showIcon
                placeholder="JJ/MM/AAAA HH:mm"
                className={`w-full ${errors.date_prevue ? 'p-invalid' : ''}`}
              />
            )}
          />
          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            Tous les jours sont autorisés, y compris le week-end.
          </p>
          <FieldError message={errors.date_prevue?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Modèle d'affichage
        </label>
        <Controller
          control={control}
          name="template"
          render={({ field }) => (
            <div className="grid gap-3 sm:grid-cols-2">
              {TEMPLATE_OPTIONS.map((option) => {
                const selected = field.value === option.value
                return (
                  <button type="button"
                    key={option.value}
                    
                    aria-pressed={selected}
                    onClick={() => field.onChange(option.value)}
                    className={`relative overflow-hidden rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-fongo-700 bg-fongo-50 ring-2 ring-fongo-700/15'
                        : 'border-slate-200 bg-white hover:border-fongo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? 'bg-fongo-700 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className={`${option.icon} text-sm`} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                          {option.description}
                        </span>
                      </span>
                      {selected && (
                        <Icon className="pi pi-check-circle ml-auto shrink-0 text-fongo-700" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        />
        <FieldError message={errors.template?.message} />
      </div>

      <div>
        <div className="mb-1.5 flex items-end justify-between gap-3">
          <label
            htmlFor="annonce-contenu"
            className="block text-sm font-semibold text-slate-700"
          >
            Contenu
          </label>
          <span className="text-[11px] tabular-nums text-slate-400">
            {contenuLength} caractères
          </span>
        </div>
        <Controller
          control={control}
          name="contenu"
          render={({ field }) => (
            <InputTextarea
              id="annonce-contenu"
              {...field}
              rows={7}
              autoResize
              placeholder="Rédigez votre annonce…"
              className={`w-full ${errors.contenu ? 'p-invalid' : ''}`}
            />
          )}
        />
        <FieldError message={errors.contenu?.message} />
      </div>

      {template === 'fongo_expo' && (
        <div className="rounded-2xl border border-fongo-100 bg-fongo-50/50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-fongo-700 shadow-sm">
              <Icon className="pi pi-images" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Images de l'affiche
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Remplacez les cartes « ? » par vos visuels. Un format portrait
                est conseillé.
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <AnnonceImageField
              inputId="annonce-image1"
              label="Carte avant"
              hint="Carte de gauche, au premier plan (facultatif)."
              currentUrl={annonce?.image1}
              cleared={image1Clear}
              file={image1File}
              onSelect={onSelectImage1}
              onRemove={onRemoveImage1}
            />

            <AnnonceImageField
              inputId="annonce-image2"
              label="Carte arrière"
              hint="Carte de droite, en arrière-plan (facultatif)."
              currentUrl={annonce?.image2}
              cleared={image2Clear}
              file={image2File}
              onSelect={onSelectImage2}
              onRemove={onRemoveImage2}
            />
          </div>
        </div>
      )}
    </div>
  )
}
