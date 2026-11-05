import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSEO } from '@/hooks/useSEO'
import { Icon } from '@/components/Icon'
import { Reveal } from '@/components/Reveal'
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
  },
  {
    number: '02',
    title: 'JavaScript & interactivité',
    description:
      'Ajoutez de la logique et du mouvement à vos pages pour transformer des maquettes en expériences vivantes.',
    topics: ['JavaScript', 'DOM', 'Événements'],
    level: 'Intermédiaire',
  },
  {
    number: '03',
    title: 'Python, données & Django',
    description:
      'Passez au back-end : programmez en Python, modélisez vos données et déployez de vraies applications web.',
    topics: ['Python', 'POO', 'SQL', 'Django'],
    level: 'Avancé',
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
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <OptimizedImage
              src="/images/logo.svg"
              alt=""
              className="h-10 w-10 shrink-0 rounded-xl shadow-sm ring-1 ring-fongo-900/10"
              width={40}
              height={40}
              loading="eager"
              plain
            />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-lg font-extrabold tracking-tight text-fongo-900">
                FongoGestion
              </span>
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-fongo-500">
                Plateforme du club FongoLab
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition hover:text-fongo-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to={ctaTo}
              className="hidden items-center gap-2 rounded-full bg-fongo-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-fongo-700 sm:inline-flex"
            >
              {ctaLabel}
              <Icon className="pi pi-arrow-right text-[11px]" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-fongo-900 transition hover:bg-fongo-50 lg:hidden"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Icon className={menuOpen ? 'pi pi-times' : 'pi pi-bars'} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="border-t border-slate-100 bg-white px-4 pb-5 pt-2 lg:hidden"
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
              <Link
                to={ctaTo}
                onClick={() => setMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-fongo-900 px-5 py-3 text-sm font-semibold text-white"
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
        {/* Hero                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-fongo-950">
          <OptimizedImage
            src="/images/background.jpeg"
            avifSrc="/images/background.avif"
            webpSrc="/images/background.webp"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-fongo-950 via-fongo-950/95 to-fongo-900/60" />
          <div
            className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-fongo-500/20 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <Reveal delay={60}>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  FongoLab · Burundi
                </span>

                <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Apprenez à coder.
                  <br />
                  <span className="bg-gradient-to-r from-cyan-300 to-fongo-300 bg-clip-text text-transparent">
                    Construisez votre avenir.
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-fongo-100/85 sm:text-lg sm:leading-8">
                  Rejoignez la communauté tech de FongoLab et progressez du
                  premier site web à une application complète. Un parcours
                  pratique, encadré par des formateurs passionnés.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to={ctaTo}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-fongo-900 shadow-lg shadow-fongo-950/30 transition hover:-translate-y-0.5 hover:bg-fongo-50"
                  >
                    {isAuthenticated
                      ? 'Accéder à mon espace'
                      : 'Accéder à la plateforme'}
                    <Icon className="pi pi-arrow-right text-xs" />
                  </Link>
                  <a
                    href="#langages"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300/60 hover:bg-white/5"
                  >
                    Découvrir le programme
                  </a>
                </div>

                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-fongo-100">
                  {[
                    'Formations pratiques',
                    'Formateurs dédiés',
                    'Communauté active',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Icon className="pi pi-check-circle text-cyan-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={220} className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  className="absolute -inset-4 rounded-[2.5rem] bg-cyan-300/10 blur-2xl"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-2xl shadow-fongo-950/50">
                  <OptimizedImage
                    src="/images/membres.jpg"
                    avifSrc="/images/membres.avif"
                    webpSrc="/images/membres.webp"
                    alt="Les membres et stagiaires du club FongoLab réunis lors d’une session"
                    className="h-72 w-full rounded-[1.6rem] object-cover sm:h-80"
                    width={600}
                    height={400}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="absolute -bottom-6 -left-3 rounded-2xl border border-white/15 bg-fongo-900/95 p-4 shadow-xl backdrop-blur sm:-left-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                      <Icon className="pi pi-code text-lg" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        3 modules progressifs
                      </p>
                      <p className="text-xs text-fongo-200">
                        Du web à Django, pas à pas
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            <dl className="mt-16 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {STATS.map((stat, index) => (
                <Reveal
                  key={stat.label}
                  delay={320 + index * 70}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-lg shadow-fongo-950/20 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.09]"
                >
                  <span
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl transition duration-300 group-hover:bg-cyan-400/20"
                    aria-hidden
                  />
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-300/20 transition duration-300 group-hover:scale-105 group-hover:bg-cyan-400/15">
                    <Icon className={`${stat.icon} text-sm`} />
                  </span>

                  <div className="relative mt-6 flex flex-1 flex-col-reverse">
                    <dt className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fongo-200">
                      {stat.label}
                      <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-fongo-300/65">
                        {stat.hint}
                      </span>
                    </dt>
                    <dd className="bg-gradient-to-br from-white via-white to-cyan-200 bg-clip-text text-3xl font-extrabold leading-none tracking-tight text-transparent sm:text-4xl">
                      {stat.value}
                    </dd>
                  </div>

                  <span
                    className="pointer-events-none absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-300/80 via-cyan-300/30 to-transparent transition-transform duration-300 group-hover:scale-x-100"
                    aria-hidden
                  />
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
        {/* ---------------------------------------------------------------- */}
        {/* Langages enseignés                                               */}
        {/* ---------------------------------------------------------------- */}
        <section id="langages" className="scroll-mt-24 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-fongo-600">
                Notre programme
              </p>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-fongo-900 sm:text-4xl">
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
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-fongo-200 hover:shadow-xl hover:shadow-fongo-900/5"
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
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Parcours                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section id="programme" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-fongo-600">
                  Le parcours
                </p>
                <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-fongo-900 sm:text-4xl">
                  Un chemin clair, du premier pas au projet final
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-500">
                  Trois modules pour avancer sans se perdre, avec des exercices
                  concrets à chaque étape.
                </p>
              </div>
              <a
                href="#plateforme"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-fongo-200 bg-white px-5 py-2.5 text-sm font-semibold text-fongo-800 transition hover:border-fongo-400 hover:bg-fongo-50"
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
                  className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fongo-900 text-sm font-extrabold text-cyan-300">
                      {module.number}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-fongo-500">
                      {module.level}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {module.description}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {module.topics.map((topic) => (
                      <li
                        key={topic}
                        className="rounded-full bg-fongo-50 px-3 py-1 text-xs font-semibold text-fongo-700"
                      >
                        {topic}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Plateforme                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="plateforme"
          className="relative scroll-mt-24 overflow-hidden bg-fongo-950 py-20 text-white sm:py-24"
        >
          <div
            className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <Reveal delay={60}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  La plateforme
                </p>
                <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Tout le club, dans un seul espace
                </h2>
                <p className="mt-4 max-w-lg text-base leading-7 text-fongo-100/85">
                  FongoGestion réunit la vie du club : les personnes, les
                  paiements, les devoirs, le planning et les annonces. Une seule
                  connexion, une vision claire.
                </p>
                <Link
                  to={ctaTo}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-fongo-900 transition hover:-translate-y-0.5 hover:bg-fongo-50"
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
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-cyan-300/30 hover:bg-white/10"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
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
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Communauté                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="communaute"
          className="scroll-mt-24 bg-white py-20 sm:py-24"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <Reveal className="relative">
              <img
                src="/images/membres.jpg"
                alt="Les membres du club FongoLab lors d’une rencontre"
                className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl"
                width="800"
                height="600"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute -bottom-5 right-4 rounded-2xl bg-fongo-900 px-5 py-4 text-white shadow-xl sm:right-6">
                <p className="text-xl font-extrabold">FongoLab</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fongo-200">
                  Apprendre · Créer · Partager
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-fongo-600">
                Notre communauté
              </p>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-fongo-900 sm:text-4xl">
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
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fongo-50 text-fongo-700">
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
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Appel à l'action                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-fongo-900 py-16 sm:py-20">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(0, 196, 255, 0.25), transparent 35%), radial-gradient(circle at 80% 80%, rgba(110, 147, 245, 0.25), transparent 35%)',
            }}
            aria-hidden
          />
          <Reveal className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 ring-1 ring-white/15">
              <Icon className="pi pi-sparkles text-xl" />
            </span>
            <h2 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Prêt à rejoindre l’aventure ?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-fongo-100/85">
              Utilisez les identifiants fournis par l’administration pour accéder
              à votre espace. Une question ? L’équipe FongoLab est là pour vous
              accompagner.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={ctaTo}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-fongo-900 shadow-lg shadow-fongo-950/30 transition hover:-translate-y-0.5 hover:bg-fongo-50"
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
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Pied de page                                                        */}
      {/* ------------------------------------------------------------------ */}
      <footer className="bg-fongo-950 text-fongo-200">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Link to="/" className="flex w-fit items-center gap-3">
                <OptimizedImage
                  src="/images/logo.svg"
                  alt=""
                  className="h-10 w-10 rounded-xl ring-1 ring-white/10"
                  width={40}
                  height={40}
                  loading="eager"
                  plain
                />
                <span className="flex flex-col leading-tight">
                  <span className="text-lg font-extrabold text-white">
                    FongoGestion
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fongo-300">
                    Plateforme du club FongoLab
                  </span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-fongo-200/80">
                La plateforme qui accompagne la communauté tech de FongoLab :
                formations, membres, finances et vie du club.
              </p>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Navigation
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link to={ctaTo} className="transition hover:text-white">
                    {ctaLabel}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white">
                Contact
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:contact@fongolab.com"
                    className="inline-flex items-center gap-2 transition hover:text-white"
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
                    className="inline-flex items-center gap-2 transition hover:text-white"
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
