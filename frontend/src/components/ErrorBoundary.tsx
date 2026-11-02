import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from 'primereact/button'
import { Icon } from '@/components/Icon'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Boundary d'erreur React.
 * Lorsqu'un composant enfant plante, on affiche un écran générique aux
 * couleurs de l'application sans jamais exposer le détail technique de
 * l'erreur à l'utilisateur final.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // On log côté développeur uniquement (console / service de reporting).
    console.error('Erreur inattendue dans l’interface :', error, info)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-fongo-50 px-4 py-10">
        <div
          role="alert"
          className="w-full max-w-lg rounded-3xl border border-fongo-200 bg-white p-8 text-center shadow-sm sm:p-10"
        >
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-fongo-100 text-2xl text-fongo-900">
            <Icon className="pi pi-exclamation-triangle" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900">
            Une erreur inattendue est survenue
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            L’application a rencontré un problème. Vos données n’ont pas été
            modifiées. Rechargez la page pour reprendre votre travail.
          </p>
          <Button
            label="Recharger la page"
            icon="pi pi-refresh"
            onClick={this.handleReload}
            className="mt-6 rounded-full px-6 bg-fongo-900 text-white hover:bg-fongo-800"
          />
        </div>
      </div>
    )
  }
}
