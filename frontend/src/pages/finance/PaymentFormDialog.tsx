import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { financeApi, type PaiementPayload } from '@/api/finance'
import type { Paiement, StagiaireFinance } from '@/types'

const paymentSchema = z.object({
  montant: z
    .number({ message: 'Le montant est obligatoire.' })
    .positive('Le montant doit être supérieur à zéro.'),
  /** Le paiement est rattaché à un module : le choix « catégorie » disparaît. */
  module: z
    .number({ message: 'Sélectionnez un module.' })
    .min(1, 'Sélectionnez un module.'),
  description: z.string().min(2, 'La description est obligatoire.'),
  id_stagiaire: z.number({ message: 'Sélectionnez un stagiaire.' }),
})

type PaymentFormValues = z.infer<typeof paymentSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-500">{message}</p>
}

export function PaymentFormDialog({
  visible,
  payment,
  stagiaires,
  saving,
  onHide,
  onSubmit,
}: {
  visible: boolean
  payment: Paiement | null
  stagiaires: StagiaireFinance[]
  saving: boolean
  onHide: () => void
  onSubmit: (payload: PaiementPayload) => Promise<void>
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant: 0,
      module: 0,
      description: '',
      id_stagiaire: 0,
    },
  })

  // Modules du projet proposés à la place de l'ancien champ « Catégorie ».
  const modulesQuery = useQuery({
    queryKey: ['paiement-modules'],
    queryFn: financeApi.modulesPaiement,
    staleTime: 5 * 60_000,
  })
  const modules = modulesQuery.data ?? []

  useEffect(() => {
    if (!visible) return
    if (payment) {
      reset({
        montant: payment.montant,
        module: payment.module ?? 0,
        description: payment.description,
        id_stagiaire: payment.stagiaire.id,
      })
    } else {
      reset({
        montant: 0,
        module: 0,
        description: '',
        id_stagiaire: 0,
      })
    }
  }, [payment, reset, visible])

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
        label={payment ? 'Enregistrer' : 'Ajouter le paiement'}
        icon="pi pi-check"
        loading={saving}
        onClick={handleSubmit(async (values) => onSubmit(values))}
      />
    </div>
  )

  return (
    <Dialog
      header={payment ? 'Modifier le paiement' : 'Ajouter un paiement'}
      visible={visible}
      onHide={onHide}
      footer={footer}
      modal
      draggable={false}
      style={{ width: 'min(94vw, 560px)' }}
    >
      <form
        onSubmit={handleSubmit(async (values) => onSubmit(values))}
        className="space-y-4 pt-2"
        noValidate
      >
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Stagiaire
          </label>
          <Controller
            control={control}
            name="id_stagiaire"
            render={({ field }) => (
              <Dropdown
                value={field.value || null}
                options={stagiaires}
                optionLabel="full_name"
                optionValue="id"
                filter
                placeholder="Sélectionner un stagiaire"
                onChange={(event) => field.onChange(event.value ?? 0)}
                className={`w-full ${errors.id_stagiaire ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.id_stagiaire?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Montant
            </label>
            <Controller
              control={control}
              name="montant"
              render={({ field }) => (
                <InputNumber
                  value={field.value || null}
                  onValueChange={(event) => field.onChange(event.value ?? 0)}
                  mode="decimal"
                  suffix=" FBu"
                  min={0}
                  className={`w-full ${errors.montant ? 'p-invalid' : ''}`}
                  inputClassName="w-full"
                />
              )}
            />
            <FieldError message={errors.montant?.message} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Module
            </label>
            <Controller
              control={control}
              name="module"
              render={({ field }) => (
                <Dropdown
                  value={field.value || null}
                  options={modules}
                  optionLabel="titre"
                  optionValue="id"
                  filter
                  loading={modulesQuery.isLoading}
                  placeholder={
                    modulesQuery.isLoading
                      ? 'Chargement…'
                      : 'Sélectionner un module'
                  }
                  emptyMessage="Aucun module enregistré"
                  onChange={(event) => field.onChange(event.value ?? 0)}
                  className={`w-full ${errors.module ? 'p-invalid' : ''}`}
                />
              )}
            />
            <FieldError message={errors.module?.message} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Description
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ex. Paiement des frais du module React"
                className={`w-full ${errors.description ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.description?.message} />
        </div>
      </form>
    </Dialog>
  )
}
