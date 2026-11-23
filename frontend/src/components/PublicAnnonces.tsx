import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { annoncesApi } from '@/api/annonces'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/Reveal'
import { Skeleton } from '@/components/Skeletons'
import { AnnonceShareButton } from '@/pages/annonces/components/AnnonceShareButton'
import { formatDate, truncateText } from '@/lib/format'
import type { Annonce } from '@/types'

/** Nombre d'annonces affichées sur la page racine. */
const MAX_ANNONCES = 6

function AnnonceCard({ annonce, index }: { annonce: Annonce; index: number }) {
  return (
    // Enveloppe portant l'attribut de capture : le PNG partagé est bien ce
    // bloc, tel qu'affiché sur la page.
    <div data-annonce-card={annonce.id} className="h-full">
      <Reveal
        delay={index * 70}
        className="flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-fongo-200 hover:shadow-lg hover:shadow-fongo-900/5"
      >
      {annonce.image1 && (
        <img
          src={annonce.image1}
          alt={annonce.object}
          loading="lazy"
          decoding="async"
          className="mb-4 aspect-[16/10] w-full rounded-2xl object-cover"
        />
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-fongo-100 px-2.5 py-1 font-bold uppercase tracking-wide text-fongo-700">
          Annonce
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500">
          <Icon className="pi pi-calendar text-[11px]" />
          {formatDate(annonce.date_prevue)}
        </span>
      </div>

      <h3 className="mt-3 break-words text-base font-bold leading-6 text-slate-900">
        {annonce.object}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {truncateText(annonce.contenu, 160)}
      </p>

      <div
        data-annonce-no-capture
        className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"
      >
        {/* Partage WhatsApp / Facebook : image du rendu + lien, ouvert à tous. */}
        <AnnonceShareButton annonce={annonce} />
        <Link
          to="/annonces"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-fongo-700 transition hover:text-fongo-900"
        >
          Voir
          <Icon className="pi pi-arrow-right text-[10px]" />
        </Link>
      </div>
      </Reveal>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="mt-4 h-5 w-4/5" />
      <Skeleton className="mt-3 h-3.5 w-full" />
      <Skeleton className="mt-2 h-3.5 w-2/3" />
      <Skeleton className="mt-6 h-9 w-32 rounded-full" />
    </div>
  )
}

/**
 * Section « Annonces » de la page racine : affichée **sans connexion** pour
 * que les visiteurs voient les dernières annonces du club, avec le partage
 * WhatsApp / Facebook en image.
 *
 * En cas d'erreur, la section disparaît simplement : la page d'accueil reste
 * utilisable.
 */
export function PublicAnnonces() {
  const { data, isLoading } = useQuery({
    queryKey: ['annonces', 'public'],
    queryFn: () => annoncesApi.listPublic(),
    // L'API renvoie au plus 20 annonces : on n'affiche que les 6 premières.
    select: (annonces) => annonces.slice(0, MAX_ANNONCES),
  })

  if (!isLoading && (!data || data.length === 0)) return null

  return (
    <section
      id="annonces"
      className="mx-auto max-w-[1400px] scroll-mt-24 px-1.5 py-8 sm:px-2 sm:py-10"
    >
      <div className="rounded-[26px] bg-fongo-50 px-4 py-14 sm:rounded-[34px] sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fongo-600">
              À la une
            </p>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.045em] text-fongo-950 sm:text-4xl">
              Les annonces du club
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              Retrouvez les annonces du club et partagez-les en un clic sur
              WhatsApp ou Facebook.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }, (_, index) => <CardSkeleton key={index} />)
              : data?.map((annonce, index) => (
                  <AnnonceCard key={annonce.id} annonce={annonce} index={index} />
                ))}
          </div>

          {!isLoading && data && data.length > 0 && (
            <Reveal delay={140} className="mt-9 flex justify-center">
              <Link
                to="/annonces"
                className="inline-flex items-center gap-2 rounded-full bg-fongo-950 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-fongo-800"
              >
                Voir toutes les annonces
                <Icon className="pi pi-arrow-right text-xs" />
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
