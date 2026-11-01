import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'primereact/button'
import { Password } from 'primereact/password'
import { authApi } from '@/api/auth'
import { FieldError } from '@/components/forms/FieldError'
import { Icon } from '@/components/Icon'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { passwordSchema, type PasswordValues } from '../schemas'

export function SecurityTab() {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  async function save(values: PasswordValues) {
    setSaving(true)
    try {
      await authApi.changePassword(values)
      form.reset({
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
      setSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(save)} className="space-y-6" noValidate>
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Mot de passe & sécurité
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Modifiez votre mot de passe régulièrement pour sécuriser votre compte.
          Utilisez au moins 8 caractères.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Ancien mot de passe
          </label>
          <Controller
            control={form.control}
            name="old_password"
            render={({ field }) => (
              <Password
                {...field}
                feedback={false}
                toggleMask
                className={`w-full ${form.formState.errors.old_password ? 'p-invalid' : ''}`}
                inputClassName="w-full"
              />
            )}
          />
          <FieldError message={form.formState.errors.old_password?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Nouveau mot de passe
          </label>
          <Controller
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <Password
                {...field}
                feedback={false}
                toggleMask
                className={`w-full ${form.formState.errors.new_password ? 'p-invalid' : ''}`}
                inputClassName="w-full"
              />
            )}
          />
          <FieldError message={form.formState.errors.new_password?.message} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Confirmer le mot de passe
          </label>
          <Controller
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <Password
                {...field}
                feedback={false}
                toggleMask
                className={`w-full ${form.formState.errors.confirm_password ? 'p-invalid' : ''}`}
                inputClassName="w-full"
              />
            )}
          />
          <FieldError message={form.formState.errors.confirm_password?.message} />
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
        <Icon className="pi pi-info-circle mr-1" />
        Après modification, votre session actuelle reste active. Utilisez le
        nouveau mot de passe lors de votre prochaine connexion.
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button
          type="submit"
          label="Mettre à jour le mot de passe"
          icon="pi pi-shield"
          loading={saving}
          className="rounded-full px-6"
        />
      </div>
    </form>
  )
}
