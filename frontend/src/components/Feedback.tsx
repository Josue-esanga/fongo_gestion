import type { ReactNode } from 'react'
import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Icon } from '@/components/Icon'

export function LoadingScreen({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-500">
      <ProgressSpinner
        style={{ width: '44px', height: '44px' }}
        strokeWidth="4"
        animationDuration="1s"
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function EmptyState({
  icon = 'pi pi-inbox',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl text-fongo-700 shadow-sm">
        <Icon className={icon} />
      </span>
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      {description && (
        <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description,
  onRetry,
  retrying = false,
}: {
  title?: string
  /** Message déjà sanitisé (sans détails techniques). Si omis, un message générique est affiché. */
  description?: string
  onRetry?: () => void
  retrying?: boolean
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-fongo-200 bg-gradient-to-b from-fongo-50 to-white px-6 py-14 text-center"
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fongo-100 text-xl text-fongo-900 shadow-sm">
        <Icon className="pi pi-exclamation-triangle" />
      </span>
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      ) : (
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Une erreur est survenue lors de la communication avec le serveur.
        </p>
      )}
      {onRetry && (
        <Button
          label="Réessayer"
          icon="pi pi-refresh"
          onClick={onRetry}
          loading={retrying}
          className="mt-5 rounded-full px-6 bg-fongo-900 text-white hover:bg-fongo-800"
        />
      )}
    </div>
  )
}
