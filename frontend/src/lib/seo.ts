/**
 * Utilitaire SEO pour FongoGestion.
 *
 * Met à jour dynamiquement <title>, <meta description> et les balises
 * Open Graph / Twitter Cards selon la route courante.
 *
 * Dans une SPA React, le document HTML n'est chargé qu'une fois. Il faut donc
 * mettre à jour les balises <head> à chaque changement de route pour que chaque
 * URL ait son propre titre et sa propre description (bon pour le SEO et pour
 * le score Lighthouse SEO).
 */

interface SEOProps {
  /** Titre de la page (suffixe " - FongoGestion" ajouté automatiquement). */
  title: string
  /** Méta description de la page. */
  description: string
  /** Chemin canonique (ex: "/dashboard"). */
  path?: string
  /** Image Open Graph (optionnel, défaut : logo). */
  image?: string
}

const SITE_NAME = 'FongoGestion'
const SITE_URL = 'https://fongolab.com'
const DEFAULT_IMAGE = '/images/logo.svg'
const DEFAULT_DESCRIPTION =
  'Plateforme moderne de gestion du club FongoLab : stagiaires, finances, devoirs, planning et annonces.'

/**
 * Met à jour les balises <head> pour la page courante.
 */
export function updateSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_IMAGE,
}: SEOProps) {
  // <title>
  document.title = `${title} — ${SITE_NAME}`

  // <meta name="description">
  let metaDesc = document.querySelector('meta[name="description"]') as
    | HTMLMetaElement
    | null
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    document.head.appendChild(metaDesc)
  }
  metaDesc.content = description

  // <meta name="url"> (canonique via <link>)
  if (path) {
    let canonical = document.querySelector('link[rel="canonical"]') as
      | HTMLLinkElement
      | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${SITE_URL}${path}`
  }

  // Open Graph
  setMeta('og:title', `${title} — ${SITE_NAME}`)
  setMeta('og:description', description)
  setMeta('og:image', image)
  setMeta('og:url', path ? `${SITE_URL}${path}` : SITE_URL)
  setMeta('og:site_name', SITE_NAME)
  setMeta('og:type', 'website')

  // Twitter Cards
  setMeta('twitter:title', `${title} — ${SITE_NAME}`)
  setMeta('twitter:description', description)
  setMeta('twitter:image', image)
  setMeta('twitter:card', 'summary_large_image')
}

/**
 * Définit ou crée une balise <meta name="...">.
 */
function setMeta(name: string, content: string) {
  let meta = document.querySelector(
    `meta[name="${name}"], meta[property="${name}"]`,
  ) as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(
      name.startsWith('og:') || name.startsWith('twitter:')
        ? 'property'
        : 'name',
      name,
    )
    document.head.appendChild(meta)
  }
  meta.content = content
}

/**
 * Mapping des routes vers leur titre et description SEO.
 */
export const ROUTE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Accueil',
    description:
      'FongoLab, la communauté tech du Burundi : apprenez HTML, CSS, JavaScript, Python, SQL et Django, et pilotez la vie du club avec FongoGestion.',
  },
  '/login': {
    title: 'Connexion',
    description: 'Connectez-vous à votre espace FongoGestion pour gérer votre profil et vos activités.',
  },
  '/dashboard': {
    title: 'Tableau de bord',
    description: 'Vue d’ensemble de votre club FongoLab : activité, finances, membres et annonces.',
  },
  '/membres': {
    title: 'Membres',
    description: 'Gérez la liste des membres et stagiaires du club FongoLab.',
  },
  '/finance': {
    title: 'Finance',
    description: 'Suivez les paiements, versements et la trésorerie du club FongoLab.',
  },
  '/devoirs': {
    title: 'Devoirs',
    description: 'Consultez et gérez les devoirs et activités du club FongoLab.',
  },
  '/planning': {
    title: 'Planning',
    description: 'Consultez le planning des événements du club FongoLab.',
  },
  '/annonces': {
    title: 'Annonces',
    description: 'Retrouvez toutes les annonces du club FongoLab.',
  },
  '/formateurs': {
    title: 'Formateurs',
    description: 'Gérez les formateurs du club FongoLab.',
  },
  '/modules': {
    title: 'Modules',
    description: 'Gérez les modules de formation du club FongoLab.',
  },
  '/presences': {
    title: 'Présences',
    description: 'Suivez les présences et scannez les QR codes d’appel du club FongoLab.',
  },
  '/parametres': {
    title: 'Paramètres',
    description: 'Configurez votre profil et les paramètres de votre compte FongoGestion.',
  },
}

/**
 * Retourne la configuration SEO pour une route donnée.
 */
export function getSEOForPath(path: string): SEOProps {
  const seo = ROUTE_SEO[path] ?? ROUTE_SEO['/']
  return {
    title: seo.title,
    description: seo.description,
    path,
  }
}
