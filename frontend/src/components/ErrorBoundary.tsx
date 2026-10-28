import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from 'primereact/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div
          role="alert"
          className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-10"
        >
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-600">
            <i className="pi pi-exclamation-triangle" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900">
            Une erreur inattendue est survenue
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            L’interface a rencontré un problème. Vos données n’ont pas été
            modifiées. Rechargez la page pour reprendre votre travail.
          </p>
          {this.state.error?.message && (
            <p className="mt-4 break-words rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
              {this.state.error.message}
            </p>
          )}
          <Button
            label="Recharger la page"
            icon="pi pi-refresh"
            onClick={this.handleReload}
            className="mt-6 rounded-full px-6"
          />
        </div>
      </div>
    )
  }
}
