import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import type { AnnoncePayload } from '@/api/annonces'
import type { Annonce } from '@/types'

const annonceSchema = z.object({
  object: z.string().min(3, "L'objet doit contenir au moins 3 caractères."),
  contenu: z.string().min(5, 'Le contenu doit contenir au moins 5 caractères.'),
})

type AnnonceFormValues = z.infer<typeof annonceSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
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
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnonceFormValues>({
    resolver: zodResolver(annonceSchema),
    defaultValues: { object: '', contenu: '' },
  })

  useEffect(() => {
    if (!visible) return
    reset({
      object: annonce?.object ?? '',
      contenu: annonce?.contenu ?? '',
    })
  }, [annonce, reset, visible])

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
        onClick={handleSubmit(async (values) => onSubmit(values))}
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
      <form
        onSubmit={handleSubmit(async (values) => onSubmit(values))}
        className="space-y-4 pt-2"
        noValidate
      >
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
      </form>
    </Dialog>
  )
}
