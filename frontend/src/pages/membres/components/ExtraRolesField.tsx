import { Controller, type Control } from 'react-hook-form'
import { Checkbox } from 'primereact/checkbox'
import { EXTRA_ROLE_OPTIONS, type MemberFormValues } from './memberFormConfig'

export function ExtraRolesField({
  control,
}: {
  control: Control<MemberFormValues>
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        Rôles supplémentaires
      </label>
      <p className="mb-2 text-xs text-slate-500">
        Un admin peut cumuler un second rôle qui détermine les seules sections
        qu'il pourra gérer.
      </p>
      <Controller
        control={control}
        name="roles_supplementaires"
        render={({ field }) => {
          const selected = field.value ?? []
          return (
            <div className="grid gap-2 sm:grid-cols-3">
              {EXTRA_ROLE_OPTIONS.map((option) => {
                const checked = selected.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      checked
                        ? 'border-fongo-700 bg-blue-50'
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
