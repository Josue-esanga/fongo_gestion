import { Controller, type Control } from 'react-hook-form'
import { Checkbox } from 'primereact/checkbox'
import {
  extraRoleOptionsFor,
  type MemberFormValues,
} from './memberFormConfig'

export function ExtraRolesField({
  control,
  role,
}: {
  control: Control<MemberFormValues>
  role: MemberFormValues['role']
}) {
  const options = extraRoleOptionsFor(role)

  // Super admin : aucun rôle supplémentaire attribuable.
  if (options.length === 0) return null

  const hint =
    role === 'stagiaire'
      ? 'Un stagiaire peut cumuler un rôle technique qui détermine les devoirs qu’il pourra voir (frontend ou backend).'
      : 'Un administrateur peut cumuler un second rôle : il ne pourra gérer que les sections liées à ce rôle.'

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        Rôles supplémentaires
      </label>
      <p className="mb-2 text-xs text-slate-500">{hint}</p>
      <Controller
        control={control}
        name="roles_supplementaires"
        render={({ field }) => {
          const selected = field.value ?? []
          return (
            <div
              className={`grid gap-2 ${options.length > 1 ? 'sm:grid-cols-3' : ''}`}
            >
              {options.map((option) => {
                const checked = selected.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      checked
                        ? 'border-fongo-700 bg-fongo-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      inputId={`extra-role-${option.value}`}
                      checked={checked}
                      onChange={(event) => {
                        const isChecked = (event.target as HTMLInputElement)
                          .checked
                        field.onChange(
                          isChecked
                            ? [...selected, option.value]
                            : selected.filter(
                                (value) => value !== option.value,
                              ),
                        )
                      }}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        {option.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {option.hint}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          )
        }}
      />
    </div>
  )
}
