import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import dayjs from 'dayjs'
import { presencesApi } from '@/api/presences'
import { QrScannerDialog } from '@/components/QrScannerDialog'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'

/**
 * Carte « Ma présence » du tableau de bord stagiaire : statut du jour et
 * bouton d'ouverture du scanner QR code (l'option Présences est masquée aux
 * stagiaires).
 */
export function MaPresenceCard() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [scannerVisible, setScannerVisible] = useState(false)
  // Renouvelé à chaque ouverture : remet le scanner à zéro (état + caméra).
  const [scanAttempt, setScanAttempt] = useState(0)

  function openScanner() {
    setScanAttempt((attempt) => attempt + 1)
    setScannerVisible(true)
  }

  const query = useQuery({
    queryKey: ['ma-presence'],
    queryFn: presencesApi.maPresence,
    refetchInterval: 30_000,
  })

  const scanMutation = useMutation({
    mutationFn: (code: string) => presencesApi.scanner(code),
    onSuccess: (result) => {
      setScannerVisible(false)
      void queryClient.invalidateQueries({ queryKey: ['ma-presence'] })
      if (result.deja_enregistre) {
        showToast(
          'info',
          'Déjà pointé',
          'Votre présence était déjà enregistrée pour cet appel.',
        )
      } else {
        showToast(
          'success',
          'Présence enregistrée',
          `Pointé à ${dayjs(result.horodatage).format('HH:mm')}${
            result.libelle ? ` pour « ${result.libelle} »` : ''
          }.`,
        )
      }
    },
    onError: (error) => {
      setScannerVisible(false)
      showToast('error', 'Scan impossible', getErrorMessage(error))
    },
  })

  const presence = query.data
  const present = presence?.present ?? false
  const ouvert = presence?.appel_ouvert ?? false
  // La formation a lieu du lundi au vendredi (le serveur refuse aussi tout
  // scan le week-end) : message adapté pour ne pas induire en erreur.
  const jourActuel = dayjs().day()
  const estWeekend = jourActuel === 0 || jourActuel === 6

  const badge = query.isLoading ? null : query.isError ? (
    <Tag severity="secondary" value="Statut indisponible" />
  ) : present ? (
    <Tag
      severity="success"
      icon="pi pi-check-circle"
      value={`Présent · ${dayjs(presence?.horodatage).format('HH:mm')}`}
    />
  ) : ouvert ? (
    <Tag severity="danger" icon="pi pi-times-circle" value="Absent" />
  ) : (
    <Tag severity="secondary" icon="pi pi-clock" value="Aucun appel" />
  )

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <i className="pi pi-qrcode text-lg" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ma présence</h2>
            <p className="text-xs text-slate-500">
              Pointage de l'appel du jour par QR code.
            </p>
          </div>
        </div>
        {badge}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          {present
            ? `Votre présence est enregistrée${
                presence?.libelle ? ` pour « ${presence.libelle} »` : ''
              }. Vous n'avez plus rien à faire.`
            : ouvert
              ? "Un appel est en cours : scannez le QR code affiché en salle pour vous déclarer présent."
              : estWeekend
                ? "Week-end : la formation a lieu du lundi au vendredi. Les présences reprennent le lundi prochain."
                : "Aucun appel n'est ouvert pour le moment : revenez dès qu'un administrateur démarre l'appel en classe."}
        </p>

        {!present && ouvert && (
          <Button
            label="Scanner le QR"
            icon="pi pi-camera"
            loading={scanMutation.isPending}
            className="shrink-0 rounded-full px-5"
            onClick={openScanner}
          />
        )}
      </div>

      <QrScannerDialog
        key={scanAttempt}
        visible={scannerVisible}
        onHide={() => setScannerVisible(false)}
        onCode={(code) => scanMutation.mutate(code)}
      />
    </section>
  )
}
