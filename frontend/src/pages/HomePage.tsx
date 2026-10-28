import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-[#3385c7] px-5 py-4 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#3385c7]">
              FG
            </span>
            <h1 className="text-2xl font-bold">FongoGestion</h1>
          </div>
          <span className="hidden rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold sm:inline-flex">
            🇨🇩 FongoLab · RDC
          </span>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 text-sm font-semibold text-[#4a69bd]">
          <a
            href="https://www.fongolab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-blue-800 hover:underline"
          >
            Visiter notre site web
          </a>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="hidden text-slate-500 sm:inline">
            Gestion des stagiaires, finances et activités du club
          </span>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="ml-auto rounded-full bg-[#3385c7] px-4 py-2 text-white transition hover:bg-blue-700"
          >
            {isAuthenticated ? 'Tableau de bord' : 'Se connecter'}
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#3385c7]">
            Bienvenue
          </p>
          <h2 className="text-balance text-2xl font-bold text-[#304d8e] sm:text-3xl">
            Système d'information de gestion du club FongoLab
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            Une plateforme unique pour gérer les membres, les paiements, les devoirs,
            le planning et les annonces de votre communauté.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="rounded-full bg-[#304d8e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243a6d]"
            >
              {isAuthenticated ? 'Accéder à mon espace' : 'Accéder à la plateforme'}
            </Link>
            <a
              href="https://www.fongolab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-[#3385c7] hover:text-[#3385c7]"
            >
              Découvrir FongoLab
            </a>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <div className="h-2 w-5 rounded bg-[#3385c7]" />
          <h3 className="text-xl font-bold text-slate-700">
            Comment accéder au système et aux exigences de l'application ?
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-3">
            <div className="mb-5 rounded-lg bg-[#3385c7] p-3 font-semibold text-white shadow-md">
              Comment se connecter
            </div>
            <p className="mb-7 text-sm leading-relaxed text-slate-600">
              Veuillez vous connecter avec votre identifiant stagiaire et le mot de
              passe que vous avez créé lors de votre inscription ou qui vous a été
              fourni par l'administration.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:contact@fongolab.com"
                className="block rounded-lg border-l-4 border-transparent bg-slate-50 p-3 text-sm font-semibold text-[#304d8e] transition hover:border-[#3385c7] hover:bg-slate-100"
              >
                Nous contacter
              </a>
              <Link
                to="/login"
                className="block rounded-lg border-l-4 border-transparent bg-slate-50 p-3 text-sm font-semibold text-[#304d8e] transition hover:border-[#3385c7] hover:bg-slate-100"
              >
                Accéder à mon espace personnel
              </Link>
              <div className="rounded-lg border-l-4 border-[#3385c7] bg-blue-50 p-3 text-sm text-slate-600">
                <span className="font-semibold text-[#304d8e]">À noter :</span> vos
                identifiants sont strictement personnels. Contactez un administrateur
                en cas d'oubli.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
            <div className="h-full min-h-64 w-full overflow-hidden rounded-xl border border-slate-100">
              <img
                src="/images/fongolab.jpg"
                alt="Le club FongoLab"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: 'pi pi-users',
              title: 'Membres & stagiaires',
              text: 'Centralisez les profils et les rôles de votre équipe.',
            },
            {
              icon: 'pi pi-wallet',
              title: 'Finance simplifiée',
              text: 'Suivez les versements et les rapports en temps réel.',
            },
            {
              icon: 'pi pi-calendar',
              title: 'Activités du club',
              text: 'Devoirs, événements et annonces au même endroit.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3385c7]">
                <i className={feature.icon} />
              </span>
              <h4 className="font-bold text-slate-800">{feature.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-500">{feature.text}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} FongoLab — FongoGestion. Tous droits réservés.
      </footer>
    </div>
  )
}
