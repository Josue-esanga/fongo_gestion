export interface ScanFailure {
  message: string
  hint?: string
}

/** Traduit une erreur d'accès caméra en message actionnable (pas de secours). */
export function describeCameraError(error: unknown): ScanFailure {
  const name =
    typeof error === 'object' && error && 'name' in error
      ? String((error as { name: unknown }).name)
      : ''

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return {
        message: "Le navigateur refuse l'accès à la caméra.",
        hint:
          window.self !== window.top
            ? "Cette page est intégrée dans un autre site (iframe) : la caméra y est bloquée. Ouvrez l'application directement dans un onglet (nouvelle fenêtre du navigateur), autorisez la caméra, puis réessayez."
            : "Cliquez sur l'icône cadenas / caméra de la barre d'adresse, autorisez la Caméra pour ce site, puis réessayez.",
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        message: "Aucune caméra n'a été trouvée sur cet appareil.",
        hint: 'Branchez ou activez une caméra (ou autorisez-la pour ce site), puis réessayez.',
      }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        message: 'La caméra est déjà utilisée par une autre application.',
        hint: 'Fermez les visioconférences ou autres applications qui utilisent la caméra, puis réessayez.',
      }
    case 'OverconstrainedError':
      return {
        message: 'Aucune caméra compatible détectée.',
        hint: 'Réessayez : le scan utilise n’importe quelle caméra disponible.',
      }
    default:
      return {
        message: "Impossible d'activer la caméra.",
        hint: error instanceof Error ? error.message : undefined,
      }
  }
}
