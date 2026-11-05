import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { presencesApi } from '@/api/presences'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import type { SeancePresence } from '@/types'

/**
 * Hook dédié à la gestion des présences (appel par QR code).
 *
 * Encapsule :
 * - Récupération des séances, filtrage par jour (lundi-vendredi),
 * - Sélection de la séance active, récupération des participants,
 * - Démarrage, clôture, suppression d'une séance.
 *
 * Le composant appelant reste responsable de l'affichage :
 * DayFilter, QrSessionCard, AttendanceList, etc.
 */
export function usePresences() {
  const { isSuperAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [jourActif, setJourActif] = useState<string | null>(null)

  const seancesQuery = useQuery({
    queryKey: ['presences', 'seances'],
    queryFn: presencesApi.seances,
  })

  const seances = useMemo(() => seancesQuery.data ?? [], [seancesQuery.data])
  const ouverte = seances.find((item) => item.ouverte) ?? null

  // La formation a lieu du lundi au vendredi : le week-end est exclu.
  const seancesHebdo = useMemo(
    () =>
      seances.filter((item) => {
        const jour = dayjs(item.date).day()
        return jour >= 1 && jour <= 5
      }),
    [seances],
  )

  const jours = useMemo(() => {
    const parJour = new Map<string, SeancePresence[]>()
    for (const item of seancesHebdo) {
      const existant = parJour.get(item.date)
      if (existant) existant.push(item)
      else parJour.set(item.date, [item])
    }
    return [...parJour.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateJour, items]) => ({
        date: dateJour,
        items,
      }))
  }, [seancesHebdo])

  const seancesVisibles = useMemo(
    () =>
      jourActif
        ? seancesHebdo.filter((item) => item.date === jourActif)
        : seancesHebdo,
    [seancesHebdo, jourActif],
  )

  const optionsSeances = useMemo(
    () =>
      jours
        .filter((jour) => jourActif === null || jour.date === jourActif)
        .map((jour) => ({
          label: jour.items[0] ? dayjs(jour.date).format('dddd DD MMMM') : '',
          items: jour.items.map((item) => ({
            label: `${item.libelle}${item.ouverte ? ' · en cours' : ''}`,
            value: item.id,
          })),
        })),
    [jours, jourActif],
  )

  const jourActuel = dayjs().day()
  const estWeekend = jourActuel === 0 || jourActuel === 6

  const seance: SeancePresence | null =
    seancesVisibles.find((s) => s.id === selectedId) ??
    seancesVisibles.find((s) => s.ouverte) ??
    seancesVisibles[0] ??
    null

  const participantsQuery = useQuery({
    queryKey: ['presences', 'participants', seance?.id ?? null],
    queryFn: () => presencesApi.participants(seance?.id as number),
    enabled: seance !== null,
    refetchInterval: seance?.ouverte ? 4000 : false,
    refetchIntervalInBackground: false,
  })

  const participants = useMemo(
    () =>
      [...(participantsQuery.data ?? [])].sort(
        (a, b) =>
          Number(a.present) - Number(b.present) ||
          a.last_name.localeCompare(b.last_name) ||
          a.first_name.localeCompare(b.first_name),
      ),
    [participantsQuery.data],
  )

  const presents = participants.filter((p) => p.present).length
  const absents = participants.length - presents

  const demarrerMutation = useMutation({
    mutationFn: () => presencesApi.demarrer(),
    onSuccess: (nouvelle) => {
      void queryClient.invalidateQueries({ queryKey: ['presences'] })
      setSelectedId(nouvelle.id)
      setJourActif(nouvelle.date)
      showToast(
        'success',
        'Appel démarré',
        'Affichez le QR code : les stagiaires peuvent maintenant pointer leur présence.',
      )
    },
    onError: (error) =>
      showToast('error', 'Démarrage impossible', getErrorMessage(error)),
  })

  const fermerMutation = useMutation({
    mutationFn: (id: number) => presencesApi.fermer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['presences'] })
      showToast(
        'success',
        'Appel clôturé',
        'Aucun nouveau scan ne sera accepté pour cette séance.',
      )
    },
    onError: (error) =>
      showToast('error', 'Clôture impossible', getErrorMessage(error)),
  })

  const supprimerMutation = useMutation({
    mutationFn: (id: number) => presencesApi.remove(id),
    onSuccess: () => {
      setSelectedId(null)
      void queryClient.invalidateQueries({ queryKey: ['presences'] })
      showToast('success', 'Séance supprimée', "L'historique a été mis à jour.")
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  function deleteSeance(id: number) {
    supprimerMutation.mutate(id)
  }

  function selectDay(date: string | null) {
    setJourActif(date)
    setSelectedId(null)
  }

  function selectSeance(id: number | null) {
    setSelectedId(id)
  }

  const isLoading = seancesQuery.isLoading
  const isError = seancesQuery.isError
  const error = seancesQuery.error
  const isFetching = seancesQuery.isFetching || participantsQuery.isFetching

  return {
    // Données
    seances,
    seancesHebdo,
    seancesVisibles,
    jours,
    optionsSeances,
    ouverte,
    seance,
    participants,
    presents,
    absents,
    totalParticipants: participants.length,
    // État
    isLoading,
    isError,
    error,
    isFetching,
    estWeekend,
    jourActuel,
    // UI
    selectedId,
    setSelectedId,
    jourActif,
    setJourActif,
    // Actions
    demarrerMutation,
    fermerMutation,
    deleteSeance,
    selectDay,
    selectSeance,
    // Helpers
    isSuperAdmin,
  }
}
