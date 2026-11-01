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
import type { CategoriePaiement, Paiement, StagiaireFinance } from '@/types'
import { Icon } from '@/components/Icon'

const paymentSchema = z
  .object({
    montant: z
      .number({ message: 'Le montant est obligatoire.' })
      .positive('Le montant doit être supérieur à zéro.'),
    /**
     * Module sélectionné (identifiant) ou « autres » pour un frais hors
     * module. Les modules sont proposés en premier dans la liste.
     */
    cible: z
      .union([z.number().int().positive(), z.literal('autres')])
      .nullable(),
    description: z.string().min(2, 'La description est obligatoire.'),
    id_stagiaire: z
      .number({ message: 'Sélectionnez un stagiaire.' })
      .min(1, 'Sélectionnez un stagiaire.'),
  })
  .superRefine((values, ctx) => {
    if (values.cible === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['cible'],
        message: 'Sélectionnez un module ou « Autre frais ».',
      })
    }
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
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant: 0,
      cible: null,
      description: '',
      id_stagiaire: 0,
    },
  })

  const cible = watch('cible')
  const estAutreFrais = cible === 'autres'

  // Modules du projet proposés pour rattacher un versement.
  const modulesQuery = useQuery({
    queryKey: ['paiement-modules'],
    queryFn: financeApi.modulesPaiement,
    staleTime: 5 * 60_000,
  })
  const modules = modulesQuery.data ?? []

  // Les modules sont listés en premier, puis « Autre frais » en dernier.
  const cibleOptions = [
    ...modules,
    {
      id: 'autres' as const,
      titre: 'Autre frais',
      duree: 0,
      ordre: Number.MAX_SAFE_INTEGER,
      image: null,
    },
  ]

  useEffect(() => {
    if (!visible) return
    if (payment) {
      // Module existant d'abord, sinon « Autre frais ». Pour un ancien
      // paiement « module » sans référence, on demande de choisir à nouveau.
      const paymentCible =
        payment.module ??
        (payment.category === 'autres' ? ('autres' as const) : null)
      reset({
        montant: payment.montant,
        cible: paymentCible,
        description: payment.description,
        id_stagiaire: payment.stagiaire.id,
      })
    } else {
      reset({
        montant: 0,
        cible: null,
        description: '',
        id_stagiaire: 0,
      })
    }
  }, [payment, reset, visible])

  const submit = handleSubmit(async (values) => {
    if (values.cible === null) return
    const category: CategoriePaiement =
      values.cible === 'autres' ? 'autres' : 'module'
    await onSubmit({
      montant: values.montant,
      category,
      module: values.cible === 'autres' ? null : values.cible,
      description: values.description.trim(),
      id_stagiaire: values.id_stagiaire,
    })
  })

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
        onClick={submit}
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
      <form onSubmit={submit} className="space-y-4 pt-2" noValidate>
        <div>
          <label
            htmlFor="payment-stagiaire"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Stagiaire
          </label>
          <Controller
            control={control}
            name="id_stagiaire"
            render={({ field }) => (
              <Dropdown
                inputId="payment-stagiaire"
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

        <div>
          <label
            htmlFor="payment-montant"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Montant
          </label>
          <Controller
            control={control}
            name="montant"
            render={({ field }) => (
              <InputNumber
                inputId="payment-montant"
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
          <label
            htmlFor="payment-cible"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Module / type de frais
          </label>
          <Controller
            control={control}
            name="cible"
            render={({ field }) => (
              <Dropdown
                inputId="payment-cible"
                value={field.value}
                options={cibleOptions}
                optionLabel="titre"
                optionValue="id"
                filter
                loading={modulesQuery.isLoading}
                placeholder={
                  modulesQuery.isLoading
                    ? 'Chargement…'
                    : 'Choisir un module ou « Autre frais »'
                }
                itemTemplate={(option) => {
                  const autreFrais = option.id === 'autres'
                  return (
                    <div
                      className={`flex items-center gap-2 ${
                        autreFrais
                          ? 'mt-1 border-t border-slate-100 pt-2'
                          : ''
                      }`}
                    >
                      {autreFrais ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Icon className="pi pi-receipt text-xs" />
                        </span>
                      ) : option.image ? (
                        <img
                          src={option.image}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fongo-50 text-fongo-700">
                          <Icon className="pi pi-book text-xs" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {option.titre}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {autreFrais
                            ? 'Inscription, cotisation, matériel…'
                            : option.duree > 0
                              ? `${option.duree} h`
                              : 'Durée à définir'}
                        </p>
                      </div>
                    </div>
                  )
                }}
                onChange={(event) => field.onChange(event.value ?? null)}
                className={`w-full ${errors.cible ? 'p-invalid' : ''}`}
              />
            )}
          />
          <FieldError message={errors.cible?.message} />
          <p className="mt-1 text-xs text-slate-400">
            Les modules apparaissent en premier ; « Autre frais » se trouve en
            fin de liste.
          </p>
          {modulesQuery.isError && (
            <p className="mt-1 text-xs font-medium text-amber-600">
              Impossible de charger les modules. Vous pouvez tout de même
              enregistrer un paiement « Autre frais ».
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="payment-description"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            {estAutreFrais ? 'Motif du paiement' : 'Description'}
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <InputText
                {...field}
                id="payment-description"
                placeholder={
                  estAutreFrais
                    ? 'Ex. Frais d’inscription, cotisation annuelle, matériel…'
                    : 'Ex. Paiement des frais du module JavaScript'
                }
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
