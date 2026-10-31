import type { ReactNode } from 'react'

/**
 * Affiche « FongoExpo session » utilisée pour les annonces au modèle
 * « fongo_expo » : logo, cartes mystère (remplaçables par des images),
 * devise et partenaires.
 *
 * Les cartes acceptent une image (`imageFront` / `imageBack`) ; à défaut,
 * elles affichent le point d'interrogation d'origine.
 */
export interface FongoExpoProps {
  /** Texte d'accroche haut (ex. « Prévue le 06/11/2026 à 18:00 »). */
  dateInfo?: string
  /** Sous-titre (ex. extrait du contenu de l'annonce). */
  subTitle?: string
  /** Phrase mise en avant en bas de l'affiche (ex. l'objet de l'annonce). */
  catchphrase?: string
  /** Partenaires affichés en pied d'affiche. */
  partners?: string[]
  /** Image de la carte avant (carte de gauche). */
  imageFront?: string | null
  /** Image de la carte arrière (carte de droite). */
  imageBack?: string | null
  className?: string
  /** Hauteur minimale de l'affiche, surchargeable (carte ou plein écran). */
  minHeight?: string
}

const DEFAULT_PARTNERS = ['Skynet-Burundi', 'Fongolab', 'DreamTech']

function CardContent({
  image,
  fallback,
  alt,
}: {
  image?: string | null
  fallback: ReactNode
  alt: string
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt}
        loading="lazy"
        className="h-full w-full rounded-[36px] object-cover"
      />
    )
  }
  return fallback
}

export const FongoExpoSession = ({
  dateInfo = "Tous les vendredis on code le futur. FongoExpo session votre rituel de l'innovation",
  subTitle = 'Le moment idéal pour échanger entre développeurs',
  catchphrase = 'Le vendredi: On expose. On apprend. On partage',
  partners = DEFAULT_PARTNERS,
  imageFront = null,
  imageBack = null,
  className = '',
  // Fluidité mobile : l'affiche se compresse jusqu'à ~240px de large sans
  // jamais faire déborder horizontalement la page.
  minHeight = 'min-h-[500px] sm:min-h-[540px]',
}: FongoExpoProps) => {
  const fallbackMark = (
    <span className="text-5xl sm:text-7xl font-extrabold text-[#111827] select-none">
      ?
    </span>
  )

  return (
    <div
      className={`relative w-full max-w-md mx-auto ${minHeight} overflow-hidden bg-gradient-to-b from-[#0077d8] via-[#006bbd] to-[#00559e] text-white flex flex-col justify-between p-6 select-none font-sans ${className}`}
    >
      {/* Motif géométrique en bas à gauche */}
      <div
        className="absolute bottom-0 left-0 w-64 sm:w-80 h-72 pointer-events-none z-0 opacity-90"
        aria-hidden="true"
      >
        <svg viewBox="0 0 300 260" fill="none" className="w-full h-full">
          <polygon points="0,260 0,110 160,260" fill="#00a8cc" />
          <polygon points="0,260 160,260 260,260 0,60" fill="#0092b3" opacity="0.4" />
        </svg>
      </div>

      {/* --- HEADER : Logo & Slogans --- */}
      <header className="relative z-10 flex flex-col items-center text-center pt-4">
        {/* Logo FongoExpo */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            fongo
          </span>

          {/* Badge 'E' stylisé avec motif tech et tag code */}
          <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/90 bg-gradient-to-br from-[#0288d1] to-[#01579b] shadow-inner mx-0.5">
            {/* Effet grille binaire de fond */}
            <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white/20 font-mono select-none overflow-hidden leading-tight p-1 text-center">
              0101&gt;code
              <br />
              FongoExpo
              <br />
              run()
            </span>
            <span className="relative z-10 text-2xl sm:text-3xl font-black text-white">
              E
            </span>

            {/* Petit badge tag code </> */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0091ea] border border-white flex items-center justify-center text-[8px] font-mono font-bold text-white shadow-sm">
              &lt;/&gt;
            </div>
          </div>

          <div className="flex flex-col text-left pl-0.5">
            <span className="text-3xl sm:text-4xl font-light tracking-tight text-[#4fc3f7]">
              xpo
            </span>
            <span className="text-xs font-medium tracking-wide text-white/90 -mt-1 pl-0.5">
              session
            </span>
          </div>
        </div>

        {/* Textes d'accroche */}
        <div className="space-y-2 max-w-xs px-2">
          <p className="text-sm font-medium leading-snug text-white/95 drop-shadow-sm break-words">
            {dateInfo}
          </p>
          <p className="text-xs font-normal text-sky-100/85 line-clamp-4 break-words">
            {subTitle}
          </p>
        </div>
      </header>

      {/* --- SECTION CENTRALE : Les Cartes Mystère Teaser --- */}
      <main className="relative z-10 flex items-center justify-center my-auto py-8">
        {/* Scène fluide : largeur en % du conteneur (plus de 288px figés). */}
        <div className="relative w-full max-w-[18rem] aspect-[72/80]">
          {/* Label "Quoi?" en haut à droite */}
          <span className="absolute -top-3 right-8 text-xl font-medium text-white drop-shadow-sm tracking-wide">
            Quoi?
          </span>

          {/* Carte de droite (arrière-plan) */}
          <div className="absolute top-[12.5%] right-0 w-[61%] aspect-[176/224] bg-[#7be5d3] rounded-[36px] shadow-2xl overflow-hidden flex items-center justify-center transform transition-transform duration-300 hover:scale-[1.02]">
            <CardContent
              image={imageBack}
              fallback={fallbackMark}
              alt="Carte arrière de l'affiche FongoExpo"
            />
          </div>

          {/* Carte de gauche (premier plan, légèrement plus haute) */}
          <div className="absolute top-0 left-0 w-[61%] aspect-[176/224] bg-[#7be5d3] rounded-[36px] shadow-[0_20px_35px_rgba(0,0,0,0.22)] z-10 overflow-hidden flex items-center justify-center transform transition-transform duration-300 hover:scale-[1.02]">
            <CardContent
              image={imageFront}
              fallback={fallbackMark}
              alt="Carte avant de l'affiche FongoExpo"
            />
          </div>

          {/* Label "Qui?" en bas à gauche */}
          <span className="absolute -bottom-4 left-6 text-xl font-medium text-white drop-shadow-sm tracking-wide z-20">
            Qui?
          </span>
        </div>
      </main>

      {/* --- FOOTER : Devise & Partenaires --- */}
      <footer className="relative z-10 pb-4 text-center space-y-7">
        <h2 className="text-base font-bold tracking-normal text-white drop-shadow-sm line-clamp-3">
          {catchphrase}
        </h2>

        {/* Liste des partenaires */}
        <div className="flex items-center justify-between px-3 text-xs font-medium text-white/90 tracking-wide">
          {partners.map((partner, index) => (
            <span
              key={index}
              className="opacity-95 hover:opacity-100 transition-opacity"
            >
              {partner}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default FongoExpoSession
