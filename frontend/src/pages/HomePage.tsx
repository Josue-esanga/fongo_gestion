import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSEO } from '@/hooks/useSEO'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/Reveal'
import { CountUp } from '@/components/CountUp'
import { OptimizedImage } from '@/components/OptimizedImage'
import html5Logo from '@/assets/modules/html5-original.svg'
import css3Logo from '@/assets/modules/css3-original.svg'
import javascriptLogo from '@/assets/modules/javascript-original.svg'
import pythonLogo from '@/assets/modules/python-original.svg'
import databaseLogo from '@/assets/modules/database.svg'
import djangoLogo from '@/assets/modules/django-plain.svg'

const NAV_LINKS = [
  { href: '#langages', label: 'Langages' },
  { href: '#programme', label: 'Programme' },
  { href: '#plateforme', label: 'Plateforme' },
  { href: '#communaute', label: 'Communauté' },
]

const STATS = [
  {
    value: '6',
    label: 'technologies',
    hint: 'Du front au back-end',
    icon: 'pi pi-code',
  },
  {
    value: '3',
    label: 'modules progressifs',
    hint: 'Un parcours pas à pas',
    icon: 'pi pi-book',
  },
  {
    value: '100%',
    label: 'pratique',
    hint: 'Des projets concrets',
    icon: 'pi pi-bolt',
  },
  {
    value: '1',
    label: 'espace unique',
    hint: 'Tout le club réuni',
    icon: 'pi pi-th-large',
  },
]

const LANGUAGES = [
  {
    name: 'HTML5',
    logo: html5Logo,
    tag: 'Structure',
    level: 'Fondamentaux du web',
    description:
      'Construisez des pages web solides, sémantiques et accessibles avec les briques de base du web.',
  },
  {
    name: 'CSS3',
    logo: css3Logo,
    tag: 'Design',
    level: 'Interfaces modernes',
    description:
      'Créez des interfaces responsives, élégantes et agréables à utiliser sur tous les écrans.',
  },
  {
    name: 'JavaScript',
    logo: javascriptLogo,
    tag: 'Interactivité',
    level: 'Logique côté client',
    description:
      'Donnez vie à vos pages : interactions, animations et logique métier directement dans le navigateur.',
  },
  {
    name: 'Python',
    logo: pythonLogo,
    tag: 'Programmation',
    level: 'Langage polyvalent',
    description:
      'Maîtrisez un langage clair et très demandé, idéal pour le web, les données et l’automatisation.',
  },
  {
    name: 'SQL',
    logo: databaseLogo,
    tag: 'Données',
    level: 'Bases de données',
    description:
      'Concevez, interrogez et faites vivre des bases de données pour stocker les informations de vos applications.',
  },
  {
    name: 'Django',
    logo: djangoLogo,
    tag: 'Framework web',
    level: 'Applications complètes',
    description:
      'Développez des applications web robustes et sécurisées avec Python, du modèle à l’interface.',
  },
]

const MODULES = [
  {
    number: '01',
    title: 'Fondamentaux du web',
    description:
      'Posez des bases solides en créant vos premières pages, du contenu structuré au design responsive.',
    topics: ['HTML5', 'CSS3'],
    level: 'Débutant',
    image: '/images/background4',
  },
  {
    number: '02',
    title: 'JavaScript & interactivité',
    description:
      'Ajoutez de la logique et du mouvement à vos pages pour transformer des maquettes en expériences vivantes.',
    topics: ['JavaScript', 'DOM', 'Événements'],
    level: 'Intermédiaire',
    image: '/images/background6',
  },
  {
    number: '03',
    title: 'Python, données & Django',
    description:
      'Passez au back-end : programmez en Python, modélisez vos données et déployez de vraies applications web.',
    topics: ['Python', 'POO', 'SQL', 'Django'],
    level: 'Avancé',
    image: '/images/background7',
  },
]

const FEATURES = [
  {
    icon: 'pi pi-users',
    title: 'Membres & stagiaires',
    text: 'Profils, rôles et suivi des apprenants centralisés au même endroit.',
  },
  {
    icon: 'pi pi-wallet',
    title: 'Finance & paiements',
    text: 'Versements, paiements Lumicash et rapports financiers en temps réel.',
  },
  {
    icon: 'pi pi-book',
    title: 'Devoirs & progression',
    text: 'Consultez les devoirs, les échéances et l’avancement de chaque module.',
  },
  {
    icon: 'pi pi-calendar',
    title: 'Planning & présences',
    text: 'Événements du club et appels par QR code, sans paperasse.',
  },
  {
    icon: 'pi pi-megaphone',
    title: 'Annonces & communication',
    text: 'Diffusez les informations importantes à toute la communauté.',
  },
]

const VALUES = [
  {
    icon: 'pi pi-compass',
    title: 'Un parcours clair',
    text: 'Trois modules progressifs, du premier balisage HTML à une application Django complète.',
  },
  {
    icon: 'pi pi-user-edit',
    title: 'Un accompagnement humain',
    text: 'Des formateurs disponibles et un suivi personnalisé à chaque étape de votre progression.',
  },
  {
    icon: 'pi pi-bolt',
    title: 'La pratique avant tout',
    text: 'Chaque notion est mise en application dans des exercices et des projets concrets.',
  },
]

export function HomePage() {
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Balises SEO pour la page d'accueil
  useSEO()

  const ctaTo = isAuthenticated ? '/dashboard' : '/login'
  const ctaLabel = isAuthenticated ? 'Tableau de bord' : 'Se connecter'

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                          */}
      {/* ------------------------------------------------------------------ */}
      {/* Bandeau d'annonce */}
      <div className="px-1.5 pt-1.5 sm:px-2 sm:pt-2">
        <div className="mx-auto flex h-10 max-w-[1400px] items-center justify-center gap-3 rounded-full bg-fongo-950 px-4 text-center text-[10px] font-semibold text-white sm:text-[11px]">
          <span className="text-lg leading-none text-cyan-300">✦</span>
          <p>Nouvelle session · Les inscriptions sont ouvertes chez FongoLab</p>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl">
        <div className="relative mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 sm:h-24 sm:px-6">
          <div className="hidden items-center gap-6 text-[10px] font-bold tracking-[0.12em] text-slate-500 xl:flex">
            <a
              href="https://www.fongolab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-cyan-600"
            >
              FONGOLAB ↗
            </a>
            <a
              href="mailto:contact@fongolab.com"
              className="transition hover:text-cyan-600"
            >
              CONTACT ↗
            </a>
            <a
              href="#communaute"
              className="transition hover:text-cyan-600"
            >
              BURUNDI ↗
            </a>
          </div>

          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-3xl font-black tracking-[-0.045em] text-fongo-950 sm:text-4xl"
          >
            <span className="text-cyan-500">Fongo</span>Gestion
          </Link>

          <nav className="ml-auto hidden items-center gap-5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 xl:flex xl:gap-3 2xl:gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition hover:text-cyan-600"
              >
                {link.label}
              </a>
            ))}
            <Link
              to={ctaTo}
              className="ml-1 inline-flex items-center gap-2 rounded-full bg-fongo-950 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-fongo-800 2xl:px-4"
            >
              {ctaLabel}
              <Icon className="pi pi-arrow-right text-[10px]" />
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-fongo-900 transition hover:bg-fongo-50 xl:hidden"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Icon className={menuOpen ? 'pi pi-times' : 'pi pi-bars'} />
          </button>
        </div>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="border-t border-slate-100 bg-white px-4 pb-5 pt-2 xl:hidden"
          >
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-fongo-50 hover:text-fongo-900"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 px-3 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <a
                  href="https://www.fongolab.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FONGOLAB ↗
                </a>
                <a href="mailto:contact@fongolab.com">CONTACT ↗</a>
                <a
                  href="#communaute"
                  onClick={() => setMenuOpen(false)}
                  className="transition hover:text-cyan-600"
                >
                  BURUNDI ↗
                </a>
              </div>
              <Link
                to={ctaTo}
                onClick={() => setMenuOpen(false)}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-fongo-950 px-5 py-3 text-sm font-semibold text-white"
              >
                {ctaLabel}
                <Icon className="pi pi-arrow-right text-[11px]" />
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* ---------------------------------------------------------------- */}
        {/* Hero portfolio                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative mx-auto max-w-[1400px] px-1.5 pt-1.5 sm:px-2 sm:pt-2">
          <div className="relative overflow-hidden rounded-[26px] bg-fongo-950 px-4 py-5 sm:rounded-[34px] sm:px-6 sm:py-6 lg:px-8">
            <div
              className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-fongo-500/20 blur-3xl"
              aria-hidden
            />

            <div className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-[1fr_1.12fr_1fr] xl:items-stretch xl:gap-6">
              {/* Carte mobile */}
              <article className="relative order-2 flex h-[400px] flex-col justify-between overflow-hidden rounded-[24px] text-white md:h-[440px] xl:order-1 xl:h-[500px]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(145deg,#22d3ee 0%,#0891b2 45%,#1e3a8a 100%)',
                  }}
                />
                <a
                  href="#plateforme"
                  className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white backdrop-blur transition hover:bg-white/20"
                  aria-label="Découvrir la plateforme"
                >
                  ↗
                </a>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="absolute bottom-[15%] right-[-8%] h-[60%] w-[85%] opacity-90"
                    style={{
                      background:
                        'linear-gradient(135deg,#64748b,#020344 55%,#1e3a8a)',
                      clipPath:
                        'polygon(0 55%, 20% 20%, 45% 30%, 65% 0, 100% 30%, 90% 100%, 10% 100%)',
                    }}
                    aria-hidden
                  />
                  <div className="relative z-10 h-[68%] w-[43%] rounded-[32px] border-[6px] border-fongo-950 bg-fongo-950 p-[5px] shadow-2xl shadow-fongo-950/50">
                    <div
                      className="absolute left-1/2 top-2 h-3 w-[36%] -translate-x-1/2 rounded-full bg-black/80"
                      aria-hidden
                    />
                    <div
                      className="h-full w-full rounded-[23px]"
                      style={{
                        background:
                          'linear-gradient(180deg,#ffffff 0%,#22d3ee 17%,#0891b2 42%,#1e40af 70%,#020344 100%)',
                      }}
                    />
                  </div>
                </div>

                <div className="relative z-10 mt-auto bg-gradient-to-t from-black/30 to-transparent p-6">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                    Application mobile
                  </span>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    FongoGestion
                  </h2>
                </div>
              </article>

              {/* Centre */}
              <div className="order-1 flex min-w-0 flex-col items-center justify-between px-1 py-6 text-center text-white md:col-span-2 md:py-8 xl:order-2 xl:col-span-1 xl:px-0 xl:py-2">
                <div className="flex flex-col items-center">
                  <div className="h-28 w-28 rounded-full border-[3px] border-white/30 p-2 sm:h-28 sm:w-28">
                    <OptimizedImage
                      src="/images/membres.jpg"
                      webpSrc="/images/membres.webp"
                      alt="Les membres et stagiaires du club FongoLab réunis lors d’une session"
                      className="h-full w-full rounded-full object-cover"
                      width={300}
                      height={300}
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                    FongoLab · Burundi
                  </p>
                  <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-5xl xl:text-[48px] 2xl:text-[52px]">
                    Apprenez à coder.
                    <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-cyan-200 to-fongo-300 bg-clip-text text-transparent">
                      Construisez votre avenir.
                    </span>
                  </h1>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-fongo-100 sm:text-sm">
                    <span>Apprendre</span>
                    <span
                      className="h-1 w-1 rounded-full bg-white/70"
                      aria-hidden
                    />
                    <span>Créer</span>
                    <span
                      className="h-1 w-1 rounded-full bg-white/70"
                      aria-hidden
                    />
                    <span>Partager</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-3 xl:mt-auto">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-white">
                    Découvrir
                  </p>
                  <a
                    href="#statistiques"
                    className="flex h-16 w-14 items-center justify-center rounded-full bg-white text-3xl leading-none text-fongo-950 transition hover:-translate-y-1 hover:bg-cyan-300"
                    aria-label="Aller aux statistiques"
                  >
                    ↓
                  </a>
                </div>
              </div>

              {/* Carte formation */}
              <article className="relative order-3 flex h-[400px] flex-col justify-between overflow-hidden rounded-[24px] text-white md:h-[440px] xl:h-[500px]">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(145deg,#3f68d8 0%,#1a3a8f 55%,#020344 100%)',
                  }}
                />
                <a
                  href="#programme"
                  className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white backdrop-blur transition hover:bg-white/20"
                  aria-label="Découvrir le programme"
                >
                  ↗
                </a>

                <div className="absolute inset-0 flex items-center justify-center [perspective:900px]">
                  <div className="relative w-[77%] -translate-y-2 -rotate-12 rounded-[25px] border-[7px] border-fongo-950 bg-fongo-900 p-5 shadow-2xl shadow-fongo-950/50">
                    <div className="text-white">
                      <span className="inline-block rounded-full border border-white/30 px-2.5 py-1 text-[10px] font-semibold text-cyan-200">
                        Parcours pratique
                      </span>
                      <h2 className="mt-3 text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl">
                        HTML · CSS
                        <br />
                        JavaScript
                        <br />
                        Python · Django
                      </h2>
                      <div className="mt-3 space-y-1 border-t border-white/20 pt-3 text-[10px] text-cyan-100">
                        <p>✓ Projets concrets</p>
                        <p>✓ Formateurs dédiés</p>
                        <p>✓ Communauté active</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-auto bg-gradient-to-t from-black/30 to-transparent p-6">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                    Formation
                  </span>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    Du web à Django
                  </h2>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Statistiques                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="statistiques"
          className="relative z-10 mx-auto max-w-[1400px] scroll-mt-24 px-1.5 pb-2 pt-10 sm:px-2 sm:pt-12"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-4">
            {STATS.map((stat, index) => {
              const placement =
                index === 0
                  ? 'sm:w-[80%]'
                  : index === 1
                    ? 'sm:w-[80%] sm:justify-self-end'
                    : index === 2
                      ? 'sm:w-[80%] sm:justify-self-end'
                      : 'sm:w-[80%]'
              return (
                <div
                  key={stat.label}
                  className={`flex min-h-[110px] flex-col items-center justify-center rounded-[22px] border border-slate-200 bg-white px-4 py-6 transition hover:-translate-y-1 hover:border-fongo-200 hover:shadow-lg hover:shadow-fongo-900/5 sm:min-h-[140px] sm:rounded-[28px] ${placement}`}
                >
                  <CountUp
                    value={stat.value}
                    className="block text-4xl font-extrabold tracking-[-0.045em] text-fongo-950 sm:text-5xl"
                  />
                  <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 hidden text-center text-[11px] font-medium text-slate-400 sm:block">
                    {stat.hint}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Langages enseignés                                               */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="langages"
          className="mx-auto max-w-[1400px] scroll-mt-24 px-1.5 py-8 sm:px-2 sm:py-10"
        >
          <div className="rounded-[26px] bg-fongo-50 px-4 py-14 sm:rounded-[34px] sm:px-8 sm:py-16 lg:px-12">
            <div className="mx-auto max-w-6xl">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fongo-600">
                  Notre programme
                </p>
                <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.045em] text-fongo-950 sm:text-4xl">
                  Les langages que nous enseignons
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-500">
                  Des technologies choisies pour leur clarté et leur utilité sur le
                  marché. Vous les apprenez dans l’ordre, en construisant de vrais
                  projets.
                </p>
              </Reveal>

              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {LANGUAGES.map((language, index) => (
                  <Reveal
                    as="article"
                    key={language.name}
                    delay={index * 70}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-fongo-900/10"
                  >
                    <div
                      className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-fongo-50 transition group-hover:bg-fongo-100"
                      aria-hidden
                    />
                    <div className="relative flex items-start justify-between gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm ring-1 ring-fongo-900/5">
                        <OptimizedImage
                          src={language.logo as string}
                          alt={`Logo ${language.name}`}
                          className="h-full w-full object-contain"
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
                          plain
                        />
                      </span>
                      <span className="rounded-full bg-fongo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-fongo-700">
                        {language.tag}
                      </span>
                    </div>
                    <h3 className="relative mt-5 text-lg font-bold text-slate-900">
                      {language.name}
                    </h3>
                    <p className="relative mt-2 flex-1 text-sm leading-6 text-slate-500">
                      {language.description}
                    </p>
                    <p className="relative mt-5 flex items-center gap-2 text-xs font-semibold text-fongo-700">
                      <Icon className="pi pi-check-circle" />
                      {language.level}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Parcours                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="programme"
          className="mx-auto max-w-[1400px] scroll-mt-24 px-1.5 py-8 sm:px-2 sm:py-10"
        >
          <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-14 shadow-sm sm:rounded-[34px] sm:px-8 sm:py-16 lg:px-12">
            <div className="mx-auto max-w-6xl">
              <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fongo-600">
                    Le parcours
                  </p>
                  <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.045em] text-fongo-950 sm:text-4xl">
                    Un chemin clair, du premier pas au projet final
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-500">
                    Trois modules pour avancer sans se perdre, avec des exercices
                    concrets à chaque étape.
                  </p>
                </div>
                <a
                  href="#plateforme"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-fongo-200 bg-white px-5 py-3 text-sm font-bold text-fongo-800 transition hover:border-fongo-400 hover:bg-fongo-50"
                >
                  Voir la plateforme
                  <Icon className="pi pi-arrow-down text-[11px]" />
                </a>
              </Reveal>

              <ol className="mt-12 grid gap-5 lg:grid-cols-3">
                {MODULES.map((module, index) => (
                  <Reveal
                    as="li"
                    key={module.number}
                    delay={index * 90}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-fongo-200 hover:shadow-xl hover:shadow-fongo-900/5"
                  >
                    <div className="relative h-40 shrink-0 overflow-hidden sm:h-44">
                      <OptimizedImage
                        src={`${module.image}.jpeg`}
                        avifSrc={`${module.image}.avif`}
                        webpSrc={`${module.image}.webp`}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
                        width={736}
                        height={414}
                        loading="lazy"
                        decoding="async"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-fongo-950/90 via-fongo-950/35 to-fongo-950/5"
                        aria-hidden
                      />
                      <span className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-fongo-950/85 text-sm font-extrabold text-cyan-300 ring-1 ring-white/20 backdrop-blur-sm">
                        {module.number}
                      </span>
                      <span className="absolute bottom-4 right-5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/25 backdrop-blur-sm">
                        {module.level}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-bold text-slate-900">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {module.description}
                      </p>
                      <ul className="mt-auto flex flex-wrap gap-2 pt-5">
                        {module.topics.map((topic) => (
                          <li
                            key={topic}
                            className="rounded-full bg-fongo-50 px-3 py-1 text-xs font-semibold text-fongo-700"
                          >
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Plateforme                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="plateforme"
          className="mx-auto max-w-[1400px] scroll-mt-24 px-1.5 py-8 sm:px-2 sm:py-10"
        >
          <div className="relative overflow-hidden rounded-[26px] bg-fongo-950 px-4 py-14 text-white sm:rounded-[34px] sm:px-8 sm:py-16 lg:px-12">
            <div
              className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-fongo-500/20 blur-3xl"
              aria-hidden
            />

            <div className="relative mx-auto max-w-6xl">
              <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <Reveal delay={60}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    La plateforme
                  </p>
                  <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
                    Tout le club, dans un seul espace
                  </h2>
                  <p className="mt-4 max-w-lg text-base leading-7 text-fongo-100/80">
                    FongoGestion réunit la vie du club : les personnes, les
                    paiements, les devoirs, le planning et les annonces. Une seule
                    connexion, une vision claire.
                  </p>
                  <Link
                    to={ctaTo}
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-fongo-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                  >
                    {ctaLabel}
                    <Icon className="pi pi-arrow-right text-xs" />
                  </Link>
                </Reveal>

                <div className="grid gap-4 sm:grid-cols-2">
                  {FEATURES.map((feature, index) => (
                    <Reveal
                      key={feature.title}
                      delay={index * 70}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/10 sm:last:col-span-2"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                        <Icon className={feature.icon} />
                      </span>
                      <h3 className="mt-4 text-sm font-bold text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-fongo-100/75">
                        {feature.text}
                      </p>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Communauté                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="communaute"
          className="mx-auto max-w-[1400px] scroll-mt-24 px-1.5 py-8 sm:px-2 sm:py-10"
        >
          <div className="rounded-[26px] bg-fongo-50 px-4 py-14 sm:rounded-[34px] sm:px-8 sm:py-16 lg:px-12">
            <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
              <Reveal className="relative">
                <OptimizedImage
                  src="/images/membres.jpg"
                  webpSrc="/images/membres.webp"
                  alt="Les membres du club FongoLab lors d’une rencontre"
                  className="aspect-[4/3] w-full rounded-[24px] object-cover shadow-xl"
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute -bottom-5 right-4 rounded-[24px] bg-fongo-950 px-5 py-4 text-white shadow-xl sm:right-6">
                  <p className="text-xl font-extrabold">FongoLab</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
                    Apprendre · Créer · Partager
                  </p>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fongo-600">
                  Notre communauté
                </p>
                <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.045em] text-fongo-950 sm:text-4xl">
                  Bien plus qu’une formation, une famille tech
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-500">
                  À FongoLab, on apprend ensemble, on partage ses réussites et on
                  grandit au contact des autres. Les sessions, les projets et les
                  événements font partie de l’expérience.
                </p>

                <ul className="mt-7 space-y-4">
                  {VALUES.map((value) => (
                    <li key={value.title} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-fongo-950 text-cyan-300">
                        <Icon className={value.icon} />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {value.title}
                        </h3>
                        <p className="mt-0.5 text-sm leading-6 text-slate-500">
                          {value.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Appel à l'action                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-[1400px] px-1.5 py-8 sm:px-2 sm:py-10">
          <div className="relative overflow-hidden rounded-[26px] bg-fongo-950 px-4 py-16 sm:rounded-[34px] sm:px-8 sm:py-24">
            <div
              className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-fongo-500/20 blur-3xl"
              aria-hidden
            />
            <Reveal className="relative mx-auto flex max-w-3xl flex-col items-center px-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/10 text-cyan-300 ring-1 ring-white/15">
                <Icon className="pi pi-sparkles text-xl" />
              </span>
              <h2 className="mt-6 text-balance text-3xl font-extrabold tracking-[-0.045em] text-white sm:text-4xl">
                Prêt à rejoindre{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-fongo-300 bg-clip-text text-transparent">
                  l’aventure
                </span>{' '}
                ?
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-fongo-100/80">
                Utilisez les identifiants fournis par l’administration pour accéder
                à votre espace. Une question ? L’équipe FongoLab est là pour vous
                accompagner.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={ctaTo}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-fongo-950 shadow-lg shadow-fongo-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                >
                  {ctaLabel}
                  <Icon className="pi pi-arrow-right text-xs" />
                </Link>
                <a
                  href="mailto:contact@fongolab.com"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300/60 hover:bg-white/5"
                >
                  <Icon className="pi pi-envelope text-xs" />
                  Nous contacter
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Pied de page                                                        */}
      {/* ------------------------------------------------------------------ */}
      <footer className="mx-1.5 mb-1.5 rounded-[26px] bg-fongo-950 text-fongo-200 sm:mx-2 sm:mb-2 sm:rounded-[34px]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Link
                to="/"
                className="flex w-fit items-center text-3xl font-black tracking-[-0.045em] text-white"
              >
                <span className="text-cyan-400">Fongo</span>Gestion
              </Link>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                Plateforme du club FongoLab
              </p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-fongo-200/80">
                La plateforme qui accompagne la communauté tech de FongoLab :
                formations, membres, finances et vie du club.
              </p>
            </div>

            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                Navigation
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition hover:text-cyan-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link to={ctaTo} className="transition hover:text-cyan-300">
                    {ctaLabel}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                Contact
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:contact@fongolab.com"
                    className="inline-flex items-center gap-2 transition hover:text-cyan-300"
                  >
                    <Icon className="pi pi-envelope text-xs" />
                    contact@fongolab.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.fongolab.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition hover:text-cyan-300"
                  >
                    <Icon className="pi pi-globe text-xs" />
                    www.fongolab.com
                  </a>
                </li>
                <li className="inline-flex items-center gap-2">
                  <Icon className="pi pi-map-marker text-xs" />
                  Burundi
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-fongo-300/80 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} FongoLab — FongoGestion. Tous droits
              réservés.
            </p>
            <p>Conçu pour la communauté tech du Burundi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
