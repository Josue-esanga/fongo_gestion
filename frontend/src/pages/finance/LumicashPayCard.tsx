import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { financeApi } from '@/api/finance'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatMoney } from '@/lib/format'
import { copyLumicashNumber, LUMICASH_LABEL, LUMICASH_NUMBER } from '@/lib/payment'

/**
 * Carte « Payer par Lumicash » du stagiaire : le numéro du club s'affiche
 * (avec copie dans le presse-papiers), le stagiaire saisit le montant envoyé
 * puis déclare son paiement — la demande est créée « en attente » et validée
 * par un caissier.
 */
export function LumicashPayCard() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [montant, setMontant] = useState<number | null>(null)
  // Module payé : obligatoire, choisi dans la grille du projet.
  const [module, setModule] = useState<number | null>(null)

  // Même requête (et même cache) que le formulaire du caissier.
  const modulesQuery = useQuery({
    queryKey: ['paiement-modules'],
    queryFn: financeApi.modulesPaiement,
    staleTime: 5 * 60_000,
  })
  const modules = modulesQuery.data ?? []

  const mutation = useMutation({
    mutationFn: () =>
      financeApi.lumicash({
        montant: montant ?? 0,
        module: module ?? 0,
        description: `Paiement par ${LUMICASH_LABEL}`,
      }),
    onSuccess: async (paiement) => {
      setMontant(null)
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      await queryClient.invalidateQueries({ queryKey: ['finance-students'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast(
        'success',
        'Demande envoyée',
        `Votre versement de ${formatMoney(paiement.montant)} par ${LUMICASH_LABEL} attend la validation du caissier.`,
      )
    },
    onError: (error) =>
      showToast('error', "Envoi de la demande impossible", getErrorMessage(error)),
  })

  async function handleCopy() {
    const copied = await copyLumicashNumber()
    if (copied) {
      showToast(
        'info',
        'Numéro copié',
        `${LUMICASH_NUMBER} est dans votre presse-papiers.`,
      )
    } else {
      showToast('info', 'Numéro Lumicash', LUMICASH_NUMBER)
    }
  }

  const canSubmit =
    Boolean(montant && montant > 0 && module != null) && !mutation.isPending

  return (
    <section
      id="lumicash"
      className="overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm scroll-mt-24"
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="min-w-0 space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-fongo-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
            <i className="pi pi-mobile" />
            Paiement mobile
          </span>
          <h2 className="break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
            Payer par {LUMICASH_LABEL}
          </h2>
          <p className="max-w-xl break-words text-sm leading-6 text-slate-600">
            Envoyez le montant de votre versement sur le numéro ci-dessous, puis
            déclarez-le ici : votre demande reste « en attente » jusqu'à la
            validation d'un caissier. Aucune donnée bancaire n'est demandée.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Numéro {LUMICASH_LABEL} du club
              </p>
              <p className="mt-1 break-words text-lg font-extrabold tracking-wide text-fongo-700 sm:text-xl">
                {LUMICASH_NUMBER}
              </p>
            </div>
            <Button
              label="Copier le numéro"
              icon="pi pi-copy"
              outlined
              severity="info"
              size="small"
              className="rounded-full"
              onClick={() => void handleCopy()}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label
              htmlFor="lumicash-montant"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Montant envoyé (FBu)
            </label>
            <InputNumber
              id="lumicash-montant"
              value={montant}
              onValueChange={(event) => setMontant(event.value ?? null)}
              min={1}
              showButtons
              buttonLayout="horizontal"
              incrementButtonIcon="pi pi-plus"
              decrementButtonIcon="pi pi-minus"
              placeholder="Ex. 50000"
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="lumicash-module"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Module
            </label>
            <Dropdown
              id="lumicash-module"
              value={module}
              options={modules.map((m) => ({ value: m.id, label: m.titre }))}
              optionLabel="label"
              onChange={(event) =>
                setModule((event.value as number) ?? null)
              }
              className="w-full"
              placeholder="Choisir un module"
            />
          </div>

          <Button
            label="J'ai payé"
            icon="pi pi-check-circle"
            className="w-full rounded-full px-5"
            loading={mutation.isPending}
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          />
          <p className="break-words text-center text-xs text-slate-500">
            Votre demande apparaîtra comme « En attente » dans l'historique des
            paiements.
          </p>
        </div>
      </div>
    </section>
  )
}
