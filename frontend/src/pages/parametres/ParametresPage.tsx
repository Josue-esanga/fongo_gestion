import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { authApi } from '@/api/auth'
import { buildFormData } from '@/api/helpers'
import { PageHeader } from '@/components/PageHeader'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { roleLabel } from '@/lib/format'

type Tab = 'profil' | 'securite'

const profileSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire.'),
  last_name: z.string().min(1, 'Le nom est obligatoire.'),
  email: z.string().email('Adresse e-mail invalide.').or(z.literal('')),
})

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "L'ancien mot de passe est obligatoire."),
    new_password: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
    confirm_password: z.string().min(1, 'Confirmez le nouveau mot de passe.'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirm_password'],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

export function ParametresPage() {
  const { user, setUser } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'securite' ? 'securite' : 'profil'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [picture, setPicture] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const pictureInput = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  useEffect(() => {
    if (!user) return
    profileForm.reset({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
    })
  }, [profileForm, user])

  useEffect(() => {
    if (!picture) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(picture)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [picture])

  function changeTab(next: Tab) {
    setTab(next)
    setSearchParams(next === 'profil' ? {} : { tab: next }, { replace: true })
  }

  async function saveProfile(values: ProfileValues) {
    setSavingProfile(true)
    try {
      const formData = buildFormData(
        {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          email: values.email.trim(),
        },
        picture,
      )
      const updated = await authApi.updateMe(formData)
      setUser(updated)
      setPicture(null)
      if (pictureInput.current) pictureInput.current.value = ''
      showToast(
        'success',
        'Profil mis à jour',
        'Vos informations ont été enregistrées avec succès.',
      )
    } catch (error) {
      showToast('error', 'Mise à jour impossible', getErrorMessage(error))
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(values: PasswordValues) {
    setSavingPassword(true)
    try {
      await authApi.changePassword(values)
      passwordForm.reset({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
      showToast(
        'success',
        'Mot de passe modifié',
        'Votre nouveau mot de passe est maintenant actif.',
      )
    } catch (error) {
      showToast('error', 'Modification impossible', getErrorMessage(error))
    } finally {
      setSavingPassword(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Compte"
        title="Paramètres"
        subtitle="Gérez vos informations personnelles et la sécurité de votre compte FongoGestion."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => changeTab('profil')}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              tab === 'profil'
                ? 'bg-fongo-50 text-fongo-900'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="pi pi-user" />
            Mon profil
          </button>
          <button
            type="button"
            onClick={() => changeTab('securite')}
            className={`mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              tab === 'securite'
                ? 'bg-fongo-50 text-fongo-900'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="pi pi-lock" />
            Sécurité
          </button>
        </aside>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {tab === 'profil' ? (
            <form
              onSubmit={profileForm.handleSubmit(saveProfile)}
              className="space-y-6"
              noValidate
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Informations personnelles
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mettez à jour vos coordonnées et votre photo de profil.
                </p>
              </div>

              <div className="flex flex-col gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
                <div className="relative w-fit shrink-0">
                  <UserAvatar
                    user={{
                      ...user,
                      pictures: preview ?? user.pictures,
                    }}
                    size="2xl"
                  />
                  <button
                    type="button"
                    onClick={() => pictureInput.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-fongo-900 text-white shadow-lg ring-4 ring-white transition hover:-translate-y-0.5 hover:bg-fongo-700"
                    aria-label="Changer la photo de profil"
                    title="Changer la photo de profil"
                  >
                    <i className="pi pi-pencil text-xs" />
                  </button>
                  <input
                    ref={pictureInput}
                    type="file"
                    accept="image/*"
                    aria-label="Choisir une photo de profil"
                    className="hidden"
                    onChange={(event) =>
                      setPicture(event.target.files?.[0] ?? null)
                    }
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
                      <i className="pi pi-image" />
                      <span className="max-w-[16rem] truncate">{picture.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPicture(null)
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
                    control={profileForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <InputText
                        {...field}
                        className={`w-full ${profileForm.formState.errors.first_name ? 'p-invalid' : ''}`}
                      />
                    )}
                  />
                  <FieldError
                    message={profileForm.formState.errors.first_name?.message}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nom
                  </label>
                  <Controller
                    control={profileForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <InputText
                        {...field}
                        className={`w-full ${profileForm.formState.errors.last_name ? 'p-invalid' : ''}`}
                      />
                    )}
                  />
                  <FieldError
                    message={profileForm.formState.errors.last_name?.message}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Adresse e-mail
                </label>
                <Controller
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <InputText
                      {...field}
                      type="email"
                      className={`w-full ${profileForm.formState.errors.email ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                <FieldError message={profileForm.formState.errors.email?.message} />
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <Button
                  type="submit"
                  label="Enregistrer les modifications"
                  icon="pi pi-check"
                  loading={savingProfile}
                  className="rounded-full px-6"
                />
              </div>
            </form>
          ) : (
            <form
              onSubmit={passwordForm.handleSubmit(savePassword)}
              className="space-y-6"
              noValidate
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Mot de passe & sécurité
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Modifiez votre mot de passe régulièrement pour sécuriser votre
                  compte. Utilisez au moins 8 caractères.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Ancien mot de passe
                  </label>
                  <Controller
                    control={passwordForm.control}
                    name="old_password"
                    render={({ field }) => (
                      <Password
                        {...field}
                        feedback={false}
                        toggleMask
                        className={`w-full ${passwordForm.formState.errors.old_password ? 'p-invalid' : ''}`}
                        inputClassName="w-full"
                      />
                    )}
                  />
                  <FieldError
                    message={passwordForm.formState.errors.old_password?.message}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nouveau mot de passe
                  </label>
                  <Controller
                    control={passwordForm.control}
                    name="new_password"
                    render={({ field }) => (
                      <Password
                        {...field}
                        feedback={false}
                        toggleMask
                        className={`w-full ${passwordForm.formState.errors.new_password ? 'p-invalid' : ''}`}
                        inputClassName="w-full"
                      />
                    )}
                  />
                  <FieldError
                    message={passwordForm.formState.errors.new_password?.message}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Confirmer le mot de passe
                  </label>
                  <Controller
                    control={passwordForm.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <Password
                        {...field}
                        feedback={false}
                        toggleMask
                        className={`w-full ${passwordForm.formState.errors.confirm_password ? 'p-invalid' : ''}`}
                        inputClassName="w-full"
                      />
                    )}
                  />
                  <FieldError
                    message={passwordForm.formState.errors.confirm_password?.message}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                <i className="pi pi-info-circle mr-1" />
                Après modification, votre session actuelle reste active. Utilisez le
                nouveau mot de passe lors de votre prochaine connexion.
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <Button
                  type="submit"
                  label="Mettre à jour le mot de passe"
                  icon="pi pi-shield"
                  loading={savingPassword}
                  className="rounded-full px-6"
                />
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
