import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'

interface LocationState {
  from?: string
}

const CURRENT_YEAR = new Date().getFullYear()

const FEATURES = [
  { icon: 'pi pi-users', label: 'Gestion des membres et des formateurs' },
  { icon: 'pi pi-wallet', label: 'Suivi des paiements et de la trésorerie' },
  { icon: 'pi pi-calendar', label: 'Devoirs, planning et annonces du club' },
]

export function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as LocationState | null)?.from ?? '/dashboard'

  useEffect(() => {
    document.title = 'Connexion — FongoGestion'
  }, [])

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-fongo-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/background.jpeg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-fongo-950/90 via-fongo-900/80 to-fongo-900/40" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_minmax(380px,430px)]">
          <div className="hidden text-white lg:block">
            <Link to="/" className="flex w-fit items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-extrabold text-fongo-900 shadow-lg">
                FG
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-xl font-bold">FongoGestion</span>
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-200">
                  Plateforme de gestion
                </span>
              </span>
            </Link>

            <h1 className="mt-12 max-w-xl text-balance text-5xl font-extrabold leading-[1.1]">
              Pilotez votre club avec clarté.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">
              Membres, finances, devoirs, planning et annonces : retrouvez tout
              l’essentiel de la vie du club FongoLab dans un espace unique.
            </p>

            <ul className="mt-8 grid max-w-lg gap-3 text-sm text-blue-50">
              {FEATURES.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
                    <i className={feature.icon} />
                  </span>
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <Link to="/" className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-extrabold text-fongo-900 shadow-lg">
                  FG
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-lg font-bold text-white">FongoGestion</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-blue-200">
                    Plateforme de gestion
                  </span>
                </span>
              </Link>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-white/40 bg-white/95 p-7 shadow-2xl shadow-fongo-950/40 backdrop-blur-xl sm:p-9"
            >
              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-fongo-500">
                  Espace membre
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  Se connecter
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Utilisez vos identifiants pour accéder à votre espace.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <i className="pi pi-exclamation-circle mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Nom d'utilisateur
                  </label>
                  <span className="block">
                    <InputText
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Entrez votre nom d'utilisateur"
                      autoComplete="username"
                      required
                      className="w-full"
                    />
                  </span>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Mot de passe
                  </label>
                  <Password
                    inputId="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Entrez votre mot de passe"
                    feedback={false}
                    toggleMask
                    autoComplete="current-password"
                    required
                    className="w-full"
                    inputClassName="w-full"
                  />
                </div>
              </div>

              <Button
                type="submit"
                label={submitting ? 'Connexion…' : 'Connexion'}
                icon="pi pi-sign-in"
                loading={submitting}
                className="mt-7 w-full justify-center py-3"
              />

              <div className="mt-6 flex items-center justify-between gap-3 text-xs text-slate-400">
                <Link
                  to="/"
                  className="font-medium transition hover:text-fongo-900"
                >
                  ← Retour à l'accueil
                </Link>
                <span>© {CURRENT_YEAR} FongoLab</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
