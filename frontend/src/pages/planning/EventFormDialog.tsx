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
import type { EventPayload } from '@/api/events'
import type { EventItem } from '@/types'

const eventSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
  description: z
    .string()
    .min(5, 'La description doit contenir au moins 5 caractères.'),
  date: z.date({ message: "La date de l'événement est obligatoire." }),
})

type EventFormValues = z.infer<typeof eventSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

export function EventFormDialog({
  visible,
  event,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  event: EventItem | null
  saving: boolean
  onHide: () => void
  onSubmit: (payload: EventPayload) => Promise<void>
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: dayjs().add(1, 'day').toDate(),
    },
  })

  useEffect(() => {
    if (!visible) return
    reset({
      title: event?.title ?? '',
      description: event?.description ?? '',
      date: event?.date
        ? dayjs(event.date).toDate()
        : dayjs().add(1, 'day').toDate(),
    })
  }, [event, reset, visible])

  async function submit(values: EventFormValues) {
    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      date: values.date.toISOString(),
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
        label={event ? 'Enregistrer' : "Ajouter l'événement"}
        icon="pi pi-check"
        loading={saving}
        onClick={handleSubmit(submit)}
      />
    </div>
  )

  return (
    <Dialog
      header={event ? "Modifier l'événement" : 'Ajouter un événement'}
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
            Titre de l'événement
          </label>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ex. Atelier React & TypeScript"
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
                placeholder="Présentez l'événement, le lieu et les informations utiles…"
                className={`w-full ${errors.description ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Date et heure
          </label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(event) => field.onChange(event.value ?? new Date())}
                showTime
                hourFormat="24"
                dateFormat="dd/mm/yy"
                showIcon
                className={`w-full ${errors.date ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.date?.message} />
        </div>
      </form>
    </Dialog>
  )
}
