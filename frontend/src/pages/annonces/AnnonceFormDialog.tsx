import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Tag } from 'primereact/tag'
import type { AnnoncePayload } from '@/api/annonces'
import { FongoExpoSession } from '@/components/FongoExpoSession'
import {
  annonceCibleLabel,
  annonceCibleSeverity,
  truncateText,
} from '@/lib/format'
import { useObjectUrl } from '@/lib/useObjectUrl'
import type { Annonce, AnnonceCible, AnnonceTemplate } from '@/types'

const annonceSchema = z.object({
  object: z.string().min(3, "L'objet doit contenir au moins 3 caractères."),
  contenu: z.string().min(5, 'Le contenu doit contenir au moins 5 caractères.'),
  cible: z.enum(['tous', 'admins', 'stagiaires']),
  template: z.enum(['standard', 'fongo_expo']),
  date_prevue: z.date({ message: 'La date de prévision est obligatoire.' }),
})

type AnnonceFormValues = z.infer<typeof annonceSchema>

/** Publics visés par une annonce. */
const CIBLE_OPTIONS: Array<{ label: string; value: AnnonceCible }> = [
  { label: 'Tout le monde', value: 'tous' },
  { label: 'Administrateurs & super admins', value: 'admins' },
  { label: 'Stagiaires', value: 'stagiaires' },
]

/** Modèles d'affichage d'une annonce. */
const TEMPLATE_OPTIONS: Array<{
  label: string
  value: AnnonceTemplate
  icon: string
  description: string
}> = [
  {
    label: 'Standard',
    value: 'standard',
    icon: 'pi pi-file-edit',
    description: 'Une carte texte classique, claire et lisible.',
  },
  {
    label: 'FongoExpo session',
    value: 'fongo_expo',
    icon: 'pi pi-images',
    description: "L'affiche bleue avec les cartes mystère.",
  },
]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

/** Champ image d'une carte de l'affiche FongoExpo. */
function ImageField({
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
                <i className="pi pi-refresh text-xs" />
              </button>
              <button
                type="button"
                aria-label={`Retirer ${label.toLowerCase()}`}
                title="Retirer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-red-500"
                onClick={onRemove}
              >
                <i className="pi pi-trash text-xs" />
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
            <i className="pi pi-image" />
          </span>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          <span className="text-[11px] leading-4 text-slate-400">{hint}</span>
        </label>
      )}
      {input}
    </div>
  )
}

export function AnnonceFormDialog({
  visible,
  annonce,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  annonce: Annonce | null
  saving: boolean
  onHide: () => void
  onSubmit: (payload: AnnoncePayload) => Promise<void>
}) {
  // Images de l'affiche : fichiers choisis + retrait des images en base.
  const [image1File, setImage1File] = useState<File | null>(null)
  const [image2File, setImage2File] = useState<File | null>(null)
  const [image1Clear, setImage1Clear] = useState(false)
  const [image2Clear, setImage2Clear] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnonceFormValues>({
    resolver: zodResolver(annonceSchema),
    // Le dialogue n'est monté qu'à l'ouverture (démonté à la fermeture) :
    // les valeurs initiales proviennent directement de l'annonce éditée,
    // aucune remise à zéro à gérer dans un effet.
    defaultValues: {
      object: annonce?.object ?? '',
      contenu: annonce?.contenu ?? '',
      cible: annonce?.cible ?? 'tous',
      template: annonce?.template ?? 'standard',
      date_prevue: annonce?.date_prevue
        ? dayjs(annonce.date_prevue).toDate()
        : dayjs().add(1, 'day').hour(9).minute(0).second(0).toDate(),
    },
  })

  const template = useWatch({ control, name: 'template' })
  const objectValue = useWatch({ control, name: 'object' })
  const contenuValue = useWatch({ control, name: 'contenu' })
  const cibleValue = useWatch({ control, name: 'cible' })
  const dateValue = useWatch({ control, name: 'date_prevue' })

  const image1Url = useObjectUrl(image1File)
  const image2Url = useObjectUrl(image2File)
  const image1Preview =
    image1Url ?? (image1Clear ? null : (annonce?.image1 ?? null))
  const image2Preview =
    image2Url ?? (image2Clear ? null : (annonce?.image2 ?? null))

  const previewDate = dateValue
    ? dayjs(dateValue).format('DD/MM/YYYY [à] HH:mm')
    : 'Date à définir'
  const dateInfo = dateValue
    ? `Prévue le ${previewDate}`
    : 'Date à définir'
  const safeContent = contenuValue?.trim() ?? ''
  const previewExcerpt = safeContent
    ? truncateText(safeContent, 220)
    : "Le contenu de votre annonce apparaîtra ici."
  const posterSubtitle = safeContent
    ? truncateText(safeContent, 170)
    : "Le contenu de votre annonce apparaîtra ici."
  const previewObject = objectValue?.trim() || "Objet de l'annonce"
  const posterCatchphrase =
    objectValue?.trim() || 'Votre annonce FongoExpo'

  async function submit(values: AnnonceFormValues) {
    const payload: AnnoncePayload = {
      object: values.object,
      contenu: values.contenu,
      cible: values.cible,
      template: values.template,
      date_prevue: values.date_prevue.toISOString(),
    }

    if (values.template === 'fongo_expo') {
      payload.image1 = image1File
      payload.image2 = image2File
      if (image1Clear) payload.image1_clear = true
      if (image2Clear) payload.image2_clear = true
    }

    await onSubmit(payload)
  }

  const previewPanel = (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-fongo-700 shadow-sm">
            <i className="pi pi-eye text-xs" />
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Aperçu en direct
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm">
          {template === 'fongo_expo' ? 'Affiche' : 'Carte'}
        </span>
      </div>

      {template === 'fongo_expo' ? (
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <FongoExpoSession
            dateInfo={dateInfo}
            subTitle={posterSubtitle}
            catchphrase={posterCatchphrase}
            imageFront={image1Preview}
            imageBack={image2Preview}
            minHeight="min-h-[450px]"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Tag
              value={annonceCibleLabel(cibleValue)}
              severity={annonceCibleSeverity(cibleValue)}
            />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <i className="pi pi-calendar text-[10px]" />
              {previewDate}
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">
            {previewObject}
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {previewExcerpt}
          </p>
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <i className="pi pi-user text-[10px]" />
            Publié par l'équipe du club
          </div>
        </div>
      )}

      <p className="mt-3 px-1 text-[11px] leading-5 text-slate-400">
        L'aperçu reprend le contenu saisi ; le rendu final peut varier selon
        l'écran.
      </p>
    </div>
  )

  const dialogHeader = (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fongo-100 text-fongo-900 shadow-sm">
        <i className={`pi ${annonce ? 'pi-pencil' : 'pi-megaphone'} text-lg`} />
      </span>
      <div>
        <p className="text-base font-bold text-slate-900">
          {annonce ? "Modifier l'annonce" : 'Ajouter une annonce'}
        </p>
        <p className="text-xs text-slate-500">
          Rédigez, prévisualisez puis publiez votre message.
        </p>
      </div>
    </div>
  )

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
        <i className="pi pi-info-circle" />
        L'annonce sera diffusée selon le public choisi.
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          label="Annuler"
          icon="pi pi-times"
          severity="secondary"
          text
          onClick={onHide}
          disabled={saving}
        />
        <Button
          type="button"
          label={annonce ? 'Enregistrer' : "Publier l'annonce"}
          icon="pi pi-check"
          loading={saving}
          onClick={handleSubmit(submit)}
        />
      </div>
    </div>
  )

  return (
    <Dialog
      header={dialogHeader}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(96vw, 1020px)' }}
    >
      <form onSubmit={handleSubmit(submit)} className="pt-2" noValidate>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="annonce-object"
                className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <i className="pi pi-megaphone text-xs text-fongo-500" />
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
                        field.onChange(
                          (event.value as AnnonceCible) ?? 'tous',
                        )
                      }
                      className={`w-full ${errors.cible ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                <p className="mt-1 text-[11px] leading-4 text-slate-400">
                  Les annonces « administrateurs » sont masquées aux
                  stagiaires.
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
                      onChange={(event) =>
                        field.onChange(event.value ?? new Date())
                      }
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
                        <button
                          key={option.value}
                          type="button"
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
                              <i className={`${option.icon} text-sm`} />
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
                              <i className="pi pi-check-circle ml-auto shrink-0 text-fongo-700" />
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
                  {contenuValue?.length ?? 0} caractères
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
                    <i className="pi pi-images" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Images de l'affiche
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      Remplacez les cartes « ? » par vos visuels. Un format
                      portrait est conseillé.
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ImageField
                    inputId="annonce-image1"
                    label="Carte avant"
                    hint="Carte de gauche, au premier plan (facultatif)."
                    currentUrl={annonce?.image1}
                    cleared={image1Clear}
                    file={image1File}
                    onSelect={(file) => {
                      setImage1File(file)
                      setImage1Clear(false)
                    }}
                    onRemove={() => {
                      if (image1File) {
                        setImage1File(null)
                      } else {
                        setImage1Clear(true)
                      }
                    }}
                  />

                  <ImageField
                    inputId="annonce-image2"
                    label="Carte arrière"
                    hint="Carte de droite, en arrière-plan (facultatif)."
                    currentUrl={annonce?.image2}
                    cleared={image2Clear}
                    file={image2File}
                    onSelect={(file) => {
                      setImage2File(file)
                      setImage2Clear(false)
                    }}
                    onRemove={() => {
                      if (image2File) {
                        setImage2File(null)
                      } else {
                        setImage2Clear(true)
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-2">{previewPanel}</div>
          </aside>
        </div>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-1 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <i className="pi pi-eye text-fongo-600" />
              Aperçu de l'annonce
            </span>
            <i className="pi pi-chevron-down text-xs text-slate-400" />
          </summary>
          <div className="p-2 pt-0">{previewPanel}</div>
        </details>
      </form>
    </Dialog>
  )
}
