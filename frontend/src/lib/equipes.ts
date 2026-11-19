import type { RoleSupplementaire } from '@/types'

/**
 * Équipes projet d'un stagiaire : « frontend » et/ou « backend ».
 * Renvoie un tableau vide quand le stagiaire n'a pas d'équipe.
 */
export function equipesDe(stagiaire: {
  roles_supplementaires?: RoleSupplementaire[]
}): RoleSupplementaire[] {
  const extras = stagiaire.roles_supplementaires ?? []
  return (['frontend', 'backend'] as const).filter((equipe) =>
    extras.includes(equipe),
  )
}
