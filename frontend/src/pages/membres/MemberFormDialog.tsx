import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { UserAvatar } from '@/components/UserAvatar'
import type { UserPayload } from '@/api/users'
import type { Role, User } from '@/types'

const memberSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire.'),
  last_name: z.string().min(1, 'Le nom est obligatoire.'),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères."),
  email: z
    .string()
    .email('Adresse e-mail invalide.')
    .or(z.literal(''))
    .optional(),
  role: z.enum(['super_admin', 'admin', 'stagiaire']),
  password: z.string().optional(),
})

type MemberFormValues = z.infer<typeof memberSchema>

const ROLE_OPTIONS: Array<{ label: string; value: Role }> = [
  { label: 'Stagiaire', value: 'stagiaire' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Super administrateur', value: 'super_admin' },
]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

export function MemberFormDialog({
  visible,
  member,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  member: User | null
  saving: boolean
  onHide: () => void
  onSubmit: (payload: UserPayload, picture: File | null) => Promise<void>
}) {
  const isEdit = Boolean(member)
  const [picture, setPicture] = useState<File | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      role: 'stagiaire',
      password: '',
    },
  })

  useEffect(() => {
    if (!visible) return
    setPicture(null)
    if (member) {
      reset({
        first_name: member.first_name ?? '',
        last_name: member.last_name ?? '',
        username: member.username,
        email: member.email ?? '',
        role: member.role,
        password: '',
      })
    } else {
      reset({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        role: 'stagiaire',
        password: '',
      })
    }
  }, [member, reset, visible])

  async function submit(values: MemberFormValues) {
    if (!isEdit && !values.password) {
      setError('password', {
        type: 'manual',
        message: 'Le mot de passe est obligatoire à la création.',
      })
      return
    }
    if (values.password && values.password.length < 8) {
      setError('password', {
        type: 'manual',
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      })
      return
    }

    const payload: UserPayload = {
      username: values.username.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email?.trim() || '',
      role: values.role,
    }
    if (values.password) payload.password = values.password

    await onSubmit(payload, picture)
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
        label={isEdit ? 'Enregistrer' : 'Ajouter le membre'}
        icon="pi pi-check"
        loading={saving}
        onClick={handleSubmit(submit)}
      />
    </div>
  )

  return (
    <Dialog
      header={isEdit ? 'Modifier le membre' : 'Ajouter un membre'}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(94vw, 640px)' }}
    >
      <form
        onSubmit={handleSubmit(submit)}
        className="space-y-4 pt-2"
        noValidate
      >
        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <UserAvatar user={member} size="lg" />
          <div>
            {isEdit ? (
              <>
                <p className="text-sm font-semibold text-slate-800">
                  {member?.full_name || member?.username}
                </p>
                <p className="text-xs text-slate-500">Modification du profil</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">
                  Nouveau membre
                </p>
                <p className="text-xs text-slate-500">
                  Un mot de passe est requis pour créer le compte.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Prénom
            </label>
            <Controller
              control={control}
              name="first_name"
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="Ex. Josué"
                  className={`w-full ${errors.first_name ? 'p-invalid' : ''}`}
                />
              )}
            />
            <FieldError message={errors.first_name?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Nom
            </label>
            <Controller
              control={control}
              name="last_name"
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="Ex. Muteba"
                  className={`w-full ${errors.last_name ? 'p-invalid' : ''}`}
                />
              )}
            />
            <FieldError message={errors.last_name?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Nom d'utilisateur
            </label>
            <Controller
              control={control}
              name="username"
              render={({ field }) => (
                <InputText
                  {...field}
                  placeholder="j.muteba"
                  autoComplete="off"
                  className={`w-full ${errors.username ? 'p-invalid' : ''}`}
                />
              )}
            />
            <FieldError message={errors.username?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Adresse e-mail
            </label>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <InputText
                  {...field}
                  type="email"
                  placeholder="nom@fongolab.com"
                  className={`w-full ${errors.email ? 'p-invalid' : ''}`}
                />
              )}
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Rôle
            </label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  options={ROLE_OPTIONS}
                  onChange={(event) => field.onChange(event.value)}
                  className="w-full"
                />
              )}
            />
            <FieldError message={errors.role?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {isEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            </label>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Password
                  {...field}
                  inputId="member-password"
                  feedback={false}
                  toggleMask
                  placeholder={
                    isEdit ? 'Laisser vide pour conserver' : '8 caractères minimum'
                  }
                  className={`w-full ${errors.password ? 'p-invalid' : ''}`}
                  inputClassName="w-full"
                />
              )}
            />
            <FieldError message={errors.password?.message} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Photo de profil
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setPicture(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-fongo-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-fongo-900 hover:file:bg-fongo-200"
          />
          {picture && (
            <p className="mt-1 text-xs text-slate-500">
              Fichier sélectionné : {picture.name}
            </p>
          )}
        </div>
      </form>
    </Dialog>
  )
}
