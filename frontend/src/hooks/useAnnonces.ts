import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { annoncesApi, type AnnoncePayload } from '@/api/annonces'
import { captureAndUploadPoster } from '@/lib/annonceCapture'
import { useToast } from '@/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'
import { formatDateTime, annonceCibleLabel, annonceCibleSeverity, truncateText } from '@/lib/format'
import type { Annonce } from '@/types'

/**
 * Hook dédié à la gestion des annonces.
 * Encapsule : liste des annonces, filtres, création, modification, suppression.
 */
export function useAnnonces() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Annonce | null>(null)

  const { data: annonces = [], isLoading, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: ['annonces'],
      queryFn: () => annoncesApi.list(),
    })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return annonces
    return annonces.filter(
      (annonce) =>
        annonce.object.toLowerCase().includes(term) ||
        annonce.contenu.toLowerCase().includes(term) ||
        annonce.auteur.full_name.toLowerCase().includes(term),
    )
  }, [annonces, search])

  const createMutation = useMutation({
    mutationFn: (payload: AnnoncePayload) => annoncesApi.create(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AnnoncePayload }) =>
      annoncesApi.update(id, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => annoncesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['annonces'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('success', 'Annonce supprimée', "L'annonce a été retirée.")
    },
    onError: (error) =>
      showToast('error', 'Suppression impossible', getErrorMessage(error)),
  })

  /** Repasse le `poster` à jour dans tous les caches d'annonces (page et
   * accueil), pour éviter un second téléversement inutile au partage. */
  function patchPoster(updated: Annonce) {
    queryClient.setQueriesData<Annonce[]>({ queryKey: ['annonces'] }, (old) =>
      Array.isArray(old)
        ? old.map((annonce) =>
            annonce.id === updated.id ? updated : annonce,
          )
        : old,
    )
  }

  async function handleSubmit(payload: AnnoncePayload): Promise<Annonce | null> {
    try {
      let saved: Annonce
      if (editing) {
        saved = await updateMutation.mutateAsync({ id: editing.id, payload })
        showToast('success', 'Annonce modifiée', "L'annonce a été mise à jour.")
      } else {
        saved = await createMutation.mutateAsync(payload)
        showToast('success', 'Annonce publiée', "L'annonce est maintenant visible.")
      }
      await queryClient.invalidateQueries({ queryKey: ['annonces'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setEditing(null)

      // Capture du rendu affiché → poster de partage : c'est cette image qui
      // sera téléchargée et envoyée avec le lien. Non bloquant : sans capture,
      // le partage reste possible avec le seul lien (aperçu Open Graph).
      const avecPoster = await captureAndUploadPoster(saved.id)
      if (avecPoster) patchPoster(avecPoster)
      return avecPoster ?? saved
    } catch (error) {
      showToast('error', 'Enregistrement impossible', getErrorMessage(error))
      throw error
    }
  }

  function deleteAnnonce(id: number) {
    deleteMutation.mutate(id)
  }

  return {
    annonces: filtered,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    search,
    setSearch,
    editing,
    setEditing,
    createMutation,
    updateMutation,
    deleteAnnonce,
    handleSubmit,
    saving: createMutation.isPending || updateMutation.isPending,
    // Helpers de formatage pour le template
    formatDateTime,
    annonceCibleLabel,
    annonceCibleSeverity,
    truncateText,
  }
}
