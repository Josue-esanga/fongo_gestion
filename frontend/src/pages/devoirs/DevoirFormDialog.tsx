import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { Button } from 'primereact/button'
import { Calendar } from 'primereact/calendar'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import type { DevoirPayload } from '@/api/devoirs'
import type { Devoir } from '@/types'

const devoirSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
  description: z
    .string()
    .min(5, 'La description doit contenir au moins 5 caractères.'),
  limit_date: z.date({ message: 'La date limite est obligatoire.' }),
})

type DevoirFormValues = z.infer<typeof devoirSchema>

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
    },
  })

  useEffect(() => {
    if (!visible) return
    reset({
      title: devoir?.title ?? '',
      description: devoir?.description ?? '',
      limit_date: devoir?.limit_date
        ? dayjs(devoir.limit_date).toDate()
        : dayjs().add(7, 'day').toDate(),
    })
  }, [devoir, reset, visible])

  async function submit(values: DevoirFormValues) {
    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      limit_date: values.limit_date.toISOString(),
    })
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
      </form>
    </Dialog>
  )
}
