import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { authApi } from '@/api/auth'
import { buildFormData } from '@/api/helpers'
import { FieldError } from '@/components/forms/FieldError'
import { UserAvatar } from '@/components/UserAvatar'
import { Icon } from '@/components/Icon'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { roleLabel } from '@/lib/format'
import type { User } from '@/types'
import { profileSchema, type ProfileValues } from '../schemas'

export function ProfileTab({
  user,
  isStagiaire,
}: {
  user: User
  isStagiaire: boolean
}) {
  const { setUser } = useAuth()
  const { showToast } = useToast()
  const [picture, setPicture] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const pictureInput = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
    })
  }, [form, user])

  // Génère un aperçu immédiat (base64) dès qu'une image est sélectionnée
  useEffect(() => {
    if (!picture) {
      setPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.onerror = () => {
      setPreview(null)
      showToast('error', 'Erreur', 'Impossible de lire l’image sélectionnée.')
    }
    reader.readAsDataURL(picture)

    return () => {
      reader.abort()
    }
  }, [picture, showToast])

  async function save(values: ProfileValues | null) {
    // Un stagiaire ne peut modifier que sa photo de profil.
    if (isStagiaire && !picture) {
      showToast(
        'info',
        'Aucune photo sélectionnée',
        'Choisissez une photo avant de l’enregistrer.',
      )
      return
    }
    setSaving(true)
    try {
      const formData = isStagiaire
        ? buildFormData({}, picture)
        : buildFormData(
            {
              first_name: values?.first_name.trim() ?? '',
              last_name: values?.last_name.trim() ?? '',
              email: values?.email.trim() ?? '',
            },
            picture,
          )
      const updated = await authApi.updateMe(formData)
      setUser(updated)
      setPicture(null)
      setPreview(null)
      if (pictureInput.current) pictureInput.current.value = ''
      showToast(
        'success',
        'Profil mis à jour',
        isStagiaire
          ? 'Votre photo de profil a été mise à jour.'
          : 'Vos informations ont été enregistrées avec succès.',
      )
    } catch (error) {
      showToast('error', 'Mise à jour impossible', getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  // Active le bouton dès qu'une photo ou une information a été modifiée.
  const hasPendingChanges =
    Boolean(picture) || (!isStagiaire && form.formState.isDirty)

  return (
    <form
      onSubmit={
        isStagiaire
          ? (event) => {
              event.preventDefault()
              void save(null)
            }
          : form.handleSubmit(save)
      }
      className="space-y-6"
      noValidate
    >
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Informations personnelles
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isStagiaire
            ? 'Vos informations sont en lecture seule : seul un administrateur peut les modifier. Vous pouvez changer votre photo.'
            : 'Mettez à jour vos coordonnées et votre photo de profil.'}
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
        <div className="relative w-fit shrink-0">
          {/* Aperçu immédiat de l'image sélectionnée (à la place de l'avatar) */}
          {preview ? (
            <span className="inline-flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fongo-100 ring-2 ring-white">
              <img
                src={preview}
                alt="Aperçu de votre nouvelle photo de profil"
                className="h-full w-full object-cover"
              />
            </span>
          ) : (
            <UserAvatar user={user} size="2xl" />
          )}
          {preview && (
            <span className="absolute -top-2 -right-2 z-10 whitespace-nowrap rounded-full bg-fongo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow ring-2 ring-white">
              Nouveau
            </span>
          )}
          <button type="button"
            onClick={() => pictureInput.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-fongo-900 text-white shadow-lg ring-4 ring-white transition hover:-translate-y-0.5 hover:bg-fongo-700"
            aria-label="Changer la photo de profil"
            title="Changer la photo de profil"
          >
            <Icon className="pi pi-pencil text-xs" />
          </button>
          <input
            ref={pictureInput}
            type="file"
            accept="image/*"
            aria-label="Choisir une photo de profil"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setPicture(file)
              // L'aperçu est généré automatiquement par l'effet au-dessus
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">
            {user.full_name || user.username}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">
            @{user.username} · {roleLabel(user.role)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Cliquez sur le crayon pour modifier votre photo.
          </p>
          {picture && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-fongo-700">
              <Icon className="pi pi-image" />
              <span className="max-w-[16rem] truncate">{picture.name}</span>
              <button type="button"
                onClick={() => {
                  setPicture(null)
                  setPreview(null)
                  if (pictureInput.current) pictureInput.current.value = ''
                }}
                className="font-semibold text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
              >
                Retirer
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Prénom
          </label>
          <Controller
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <InputText
                {...field}
                disabled={isStagiaire}
                className={`w-full ${form.formState.errors.first_name ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={form.formState.errors.first_name?.message} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Nom
          </label>
          <Controller
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <InputText
                {...field}
                disabled={isStagiaire}
                className={`w-full ${form.formState.errors.last_name ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={form.formState.errors.last_name?.message} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Adresse e-mail
        </label>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <InputText
              {...field}
              type="email"
              disabled={isStagiaire}
              className={`w-full ${form.formState.errors.email ? 'p-invalid' : ''}`}
            />
          )}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        {isStagiaire ? (
          <>
            <p className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
              <Icon className="pi pi-lock" />
              Lecture seule : seul un administrateur peut modifier vos
              informations. Vous pouvez toutefois changer votre photo.
            </p>
            <Button
              type="submit"
              label="Enregistrer la photo"
              icon="pi pi-camera"
              loading={saving}
              disabled={!picture}
              className="rounded-full px-6"
            />
          </>
        ) : (
          <Button
            type="submit"
            label="Enregistrer les modifications"
            icon="pi pi-check"
            loading={saving}
            disabled={!hasPendingChanges}
            className="ml-auto rounded-full px-6"
          />
        )}
      </div>
    </form>
  )
}
