import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import type { ModulePedagogiquePayload } from '@/api/modules'
import type { ModulePedagogique } from '@/types'

const moduleSchema = z.object({
  ordre: z
    .number({ message: "L'ordre est obligatoire." })
    .int("L'ordre doit être un nombre entier.")
    .min(1, "L'ordre doit être supérieur à zéro."),
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caractères.'),
  sujets: z
    .string()
    .min(3, 'Indiquez au moins un sujet abordé dans ce module.'),
  description: z.string().optional(),
})

type ModuleFormValues = z.infer<typeof moduleSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

export function ModuleFormDialog({
  visible,
  module,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  module: ModulePedagogique | null
  saving: boolean
  onHide: () => void
  onSubmit: (payload: ModulePedagogiquePayload) => Promise<void>
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      ordre: 1,
      titre: '',
      sujets: '',
      description: '',
    },
  })

  useEffect(() => {
    if (!visible) return
    reset({
      ordre: module?.ordre ?? 1,
      titre: module?.titre ?? '',
      sujets: (module?.sujets ?? []).join('\n'),
      description: module?.description ?? '',
    })
  }, [module, reset, visible])

  async function submit(values: ModuleFormValues) {
    await onSubmit({
      ordre: values.ordre,
      titre: values.titre.trim(),
      // Un sujet par ligne dans le formulaire.
      sujets: values.sujets
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      description: values.description?.trim() ?? '',
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
        label={module ? 'Enregistrer' : 'Ajouter le module'}
        icon="pi pi-check"
        loading={saving}
        onClick={handleSubmit(submit)}
      />
    </div>
  )

  return (
    <Dialog
      header={module ? 'Modifier le module' : 'Ajouter un module'}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(94vw, 620px)' }}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4 pt-2" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Position
            </label>
            <Controller
              control={control}
              name="ordre"
              render={({ field }) => (
                <InputNumber
                  value={field.value}
                  onValueChange={(event) => field.onChange(event.value ?? undefined)}
                  min={1}
                  showButtons
                  className="w-full"
                  inputClassName="w-full"
                />
              )}
            />
            <FieldError message={errors.ordre?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Titre du module
            </label>
            <Controller
              control={control}
              name="titre"
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="Ex. Troisième module"
                  className={`w-full ${errors.titre ? 'p-invalid' : ''}`}
                />
              )}
            />
            <FieldError message={errors.titre?.message} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Sujets abordés
          </label>
          <p className="mb-1.5 text-xs text-slate-500">
            Un sujet par ligne, par exemple : HTML5 puis CSS3.
          </p>
          <Controller
            control={control}
            name="sujets"
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={5}
                autoResize
                placeholder={'HTML5\nCSS3\nJavaScript'}
                className={`w-full ${errors.sujets ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.sujets?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Description <span className="font-normal text-slate-400">(facultatif)</span>
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={3}
                autoResize
                placeholder="Présentez l'objectif de ce module…"
                className="w-full"
              />
            )}
          />
        </div>
      </form>
    </Dialog>
  )
}
