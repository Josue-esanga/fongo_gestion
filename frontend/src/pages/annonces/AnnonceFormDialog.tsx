import { useEffect, useMemo, useState } from 'react'
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
import type { AnnoncePayload } from '@/api/annonces'
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
const TEMPLATE_OPTIONS: Array<{ label: string; value: AnnonceTemplate }> = [
  { label: 'Standard (carte texte)', value: 'standard' },
  { label: 'FongoExpo session (affiche)', value: 'fongo_expo' },
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
  // Aperçu du fichier choisi (révoqué à chaque changement pour éviter les fuites).
  const objectUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  const preview = objectUrl ?? (cleared ? null : (currentUrl ?? null))

  if (preview) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <div className="flex items-center gap-3">
          <img
            src={preview}
            alt={label}
            className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500">
              {file ? file.name : 'Image enregistrée'}
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                label="Remplacer"
                icon="pi pi-image"
                size="small"
                text
                onClick={() => document.getElementById(inputId)?.click()}
              />
              <Button
                type="button"
                label="Retirer"
                icon="pi pi-trash"
                size="small"
                text
                severity="danger"
                onClick={onRemove}
              />
            </div>
          </div>
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const chosen = event.target.files?.[0]
            if (chosen) onSelect(chosen)
            event.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mb-2 text-xs text-slate-500">{hint}</p>
      <label
        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        htmlFor={inputId}
      >
        <i className="pi pi-image" />
        Choisir une image
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const chosen = event.target.files?.[0]
          if (chosen) onSelect(chosen)
          event.target.value = ''
        }}
      />
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

  const footer = (
    <div className="flex flex-wrap justify-end items-center gap-2">
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
  )

  return (
    <Dialog
      header={annonce ? "Modifier l'annonce" : 'Ajouter une annonce'}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(94vw, 620px)' }}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4 pt-2" noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Objet de l'annonce
          </label>
          <Controller
            control={control}
            name="object"
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ex. Réunion générale du club"
                className={`w-full ${errors.object ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.object?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Public visé
          </label>
          <p className="mb-1.5 text-xs text-slate-500">
            « Tout le monde » et « Stagiaires » sont visibles par tous les
            comptes ; « Administrateurs » est masqué aux stagiaires.
          </p>
          <Controller
            control={control}
            name="cible"
            render={({ field }) => (
              <Dropdown
                value={field.value}
                options={CIBLE_OPTIONS}
                placeholder="Choisir le public visé"
                onChange={(event) =>
                  field.onChange((event.value as AnnonceCible) ?? 'tous')
                }
                className={`w-full ${errors.cible ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.cible?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Modèle d'affichage
          </label>
          <p className="mb-1.5 text-xs text-slate-500">
            « FongoExpo session » affiche l'affiche bleue avec les cartes
            mystère, alimentée par l'objet, le contenu et la date de l'annonce.
          </p>
          <Controller
            control={control}
            name="template"
            render={({ field }) => (
              <Dropdown
                value={field.value}
                options={TEMPLATE_OPTIONS}
                placeholder="Choisir le modèle"
                onChange={(event) =>
                  field.onChange((event.value as AnnonceTemplate) ?? 'standard')
                }
                className={`w-full ${errors.template ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.template?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Date et heure prévues
          </label>
          <p className="mb-1.5 text-xs text-slate-500">
            N'importe quel jour est possible, y compris le samedi ou le
            dimanche : la date ne suit pas les jours de formation.
          </p>
          <Controller
            control={control}
            name="date_prevue"
            render={({ field }) => (
              <Calendar
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
          <FieldError message={errors.date_prevue?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Contenu
          </label>
          <Controller
            control={control}
            name="contenu"
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={6}
                autoResize
                placeholder="Rédigez votre annonce…"
                className={`w-full ${errors.contenu ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.contenu?.message} />
        </div>

        {template === 'fongo_expo' && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Images de l'affiche
              </p>
              <p className="text-xs text-slate-500">
                Remplacez le « ? » des deux cartes de l'affiche. Sans image, le
                point d'interrogation reste affiché.
              </p>
            </div>

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
        )}
      </form>
    </Dialog>
  )
}
