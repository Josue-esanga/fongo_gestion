import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { SelectButton } from 'primereact/selectbutton'
import type { DevoirPayload } from '@/api/devoirs'
import type { Devoir, DevoirCible } from '@/types'
import { Icon } from '@/components/Icon'
import {
  DEVOIR_FILE_ACCEPT,
  fileKindIcon,
  fileKindLabel,
  formatFileSize,
  validateDevoirFile,
} from '@/lib/files'

const devoirSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
  description: z
    .string()
    .min(5, 'La description doit contenir au moins 5 caractères.'),
  limit_date: z.date({ message: 'La date limite est obligatoire.' }),
  cible: z.enum(['tous', 'frontend', 'backend']),
})

type DevoirFormValues = z.infer<typeof devoirSchema>

/** Publics visibles dans le formulaire de création / modification. */
const CIBLE_OPTIONS: Array<{ label: string; value: DevoirCible }> = [
  { label: 'Tous les stagiaires', value: 'tous' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

export function DevoirFormDialog({
  visible,
  devoir,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  devoir: Devoir | null
  saving: boolean
  onHide: () => void
  onSubmit: (payload: DevoirPayload) => Promise<void>
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DevoirFormValues>({
    resolver: zodResolver(devoirSchema),
    defaultValues: {
      title: '',
      description: '',
      limit_date: dayjs().add(7, 'day').toDate(),
      cible: 'tous',
    },
  })
  const watchCible = useWatch({ control, name: 'cible' })

  // Document joint : fichier choisi pour l'envoi / retrait de celui en base.
  const [file, setFile] = useState<File | null>(null)
  const [fileCleared, setFileCleared] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const inputId = 'devoir-file-input'

  /** Fichier déjà enregistré en base, affiché tant qu'il n'est pas retiré. */
  const storedFile =
    devoir?.file && !fileCleared && !file ? devoir : null
  const currentName = file?.name ?? storedFile?.file_name ?? null
  const currentSize = file?.size ?? storedFile?.file_size ?? null

  function selectFile(chosen: File | null) {
    if (!chosen) return
    const message = validateDevoirFile(chosen)
    if (message) {
      setFile(null)
      setFileError(message)
      return
    }
    setFile(chosen)
    setFileError(null)
    // Un nouveau fichier remplace celui en base : inutile de le retirer.
    setFileCleared(false)
  }

  function removeFile() {
    if (file) {
      // Annule la nouvelle sélection : le fichier en base réapparaît.
      setFile(null)
    } else {
      setFileCleared(true)
    }
    setFileError(null)
  }

  useEffect(() => {
    if (!visible) return
    setFile(null)
    setFileCleared(false)
    setFileError(null)
    reset({
      title: devoir?.title ?? '',
      description: devoir?.description ?? '',
      limit_date: devoir?.limit_date
        ? dayjs(devoir.limit_date).toDate()
        : dayjs().add(7, 'day').toDate(),
      cible: devoir?.cible ?? 'tous',
    })
  }, [devoir, reset, visible])

  async function submit(values: DevoirFormValues) {
    const payload: DevoirPayload = {
      title: values.title.trim(),
      description: values.description.trim(),
      limit_date: values.limit_date.toISOString(),
      cible: values.cible,
    }
    if (file) payload.file = file
    else if (fileCleared) payload.file_clear = true

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
        label={devoir ? 'Enregistrer' : 'Publier le devoir'}
        icon="pi pi-check"
        loading={saving}
        onClick={handleSubmit(submit)}
      />
    </div>
  )

  return (
    <Dialog
      header={devoir ? 'Modifier le devoir' : 'Ajouter un devoir'}
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
            Titre du devoir
          </label>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ex. Exercice React — les hooks"
                className={`w-full ${errors.title ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Description
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={5}
                autoResize
                placeholder="Décrivez le travail attendu, les consignes et les ressources…"
                className={`w-full ${errors.description ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Document joint{' '}
            <span className="font-normal text-slate-400">(facultatif)</span>
          </label>

          {currentName ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-fongo-700 shadow-sm">
                <Icon className={fileKindIcon(currentName)} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {currentName}
                </p>
                <p className="text-xs text-slate-500">
                  {fileKindLabel(currentName)} · {formatFileSize(currentSize)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  label="Remplacer"
                  icon="pi pi-refresh"
                  size="small"
                  text
                  severity="info"
                  onClick={() => document.getElementById(inputId)?.click()}
                />
                <Button
                  type="button"
                  label="Retirer"
                  icon="pi pi-trash"
                  size="small"
                  text
                  severity="danger"
                  onClick={removeFile}
                />
              </div>
            </div>
          ) : (
            <label
              htmlFor={inputId}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3 transition hover:border-fongo-400 hover:bg-fongo-50/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                <Icon className="pi pi-paperclip" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-700">
                  Joindre un fichier
                </span>
                <span className="block text-xs text-slate-500">
                  PDF, Word (.doc / .docx) ou image (jpg, png, webp, gif) — 10 Mo
                  maximum
                </span>
              </span>
            </label>
          )}

          <input
            id={inputId}
            type="file"
            accept={DEVOIR_FILE_ACCEPT}
            className="sr-only"
            onChange={(event) => {
              selectFile(event.target.files?.[0] ?? null)
              event.target.value = ''
            }}
          />
          <FieldError message={fileError ?? undefined} />
          {fileCleared ? (
            <p className="mt-1.5 text-xs text-amber-600">
              Le document actuel sera retiré à l'enregistrement.{' '}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => setFileCleared(false)}
              >
                Rétablir
              </button>
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">
              Le document sera consultable et téléchargeable par les stagiaires
              concernés par ce devoir.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Date et heure limites
          </label>
          <Controller
            control={control}
            name="limit_date"
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(event) => field.onChange(event.value ?? new Date())}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                showIcon
                className={`w-full ${errors.limit_date ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.limit_date?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Destinataires
          </label>
          <Controller
            control={control}
            name="cible"
            render={({ field }) => (
              <SelectButton
                value={field.value}
                options={CIBLE_OPTIONS}
                onChange={(event) =>
                  field.onChange(event.value ?? 'tous')
                }
                allowEmpty={false}
                className="w-full"
              />
            )}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            {watchCible === 'tous'
              ? 'Le devoir apparaît chez tous les stagiaires.'
              : `Seuls les stagiaires dont le rôle supplémentaire est « ${watchCible} » verront ce devoir.`}
          </p>
          <FieldError message={errors.cible?.message} />
        </div>
      </form>
    </Dialog>
  )
}
