import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import type { FormateurPayload } from '@/api/formation'
import type { Formateur, User } from '@/types'

const formateurSchema = z.object({
  user_id: z.number({ message: 'Sélectionnez un utilisateur.' }),
  matiere: z.string().min(2, 'La matière est obligatoire.'),
  bio: z.string().min(5, 'La biographie doit contenir au moins 5 caractères.'),
})

type FormateurFormValues = z.infer<typeof formateurSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

export function FormateurFormDialog({
  visible,
  formateur,
  availableUsers,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  formateur: Formateur | null
  availableUsers: User[]
  saving: boolean
  onHide: () => void
  onSubmit: (payload: FormateurPayload) => Promise<void>
}) {
  const options = useMemo(() => {
    const list = availableUsers.map((user) => ({
      label: `${user.full_name || user.username} (${user.email || user.username})`,
      value: user.id,
    }))
    if (
      formateur &&
      !list.some((option) => option.value === formateur.user.id)
    ) {
      list.unshift({
        label: `${formateur.user.full_name} (${formateur.user.email || formateur.user.username})`,
        value: formateur.user.id,
      })
    }
    return list
  }, [availableUsers, formateur])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormateurFormValues>({
    resolver: zodResolver(formateurSchema),
    defaultValues: { user_id: 0, matiere: '', bio: '' },
  })

  useEffect(() => {
    if (!visible) return
    reset({
      user_id: formateur?.user.id ?? 0,
      matiere: formateur?.matiere ?? '',
      bio: formateur?.bio ?? '',
    })
  }, [formateur, reset, visible])

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
        label={formateur ? 'Enregistrer' : 'Nommer le formateur'}
        icon="pi pi-check"
        loading={saving}
        onClick={handleSubmit(async (values) => onSubmit(values))}
      />
    </div>
  )

  return (
    <Dialog
      header={formateur ? 'Modifier le formateur' : 'Assigner un formateur'}
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
            Utilisateur
          </label>
          <Controller
            control={control}
            name="user_id"
            render={({ field }) => (
              <Dropdown
                value={field.value || null}
                options={options}
                filter
                placeholder="Sélectionner un administrateur ou super admin"
                onChange={(event) => field.onChange(event.value ?? 0)}
                className={`w-full ${errors.user_id ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.user_id?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Matière enseignée
          </label>
          <Controller
            control={control}
            name="matiere"
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ex. React & TypeScript"
                className={`w-full ${errors.matiere ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.matiere?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Biographie
          </label>
          <Controller
            control={control}
            name="bio"
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={4}
                autoResize
                placeholder="Présentez brièvement le formateur et son parcours…"
                className={`w-full ${errors.bio ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.bio?.message} />
        </div>
      </form>
    </Dialog>
  )
}
