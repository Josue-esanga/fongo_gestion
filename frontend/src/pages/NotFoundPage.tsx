import { Link } from 'react-router-dom'
import { Button } from 'primereact/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-7xl font-extrabold text-fongo-900">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page introuvable</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/dashboard">
          <Button label="Retour au tableau de bord" icon="pi pi-home" />
        </Link>
        <Link to="/">
          <Button
            label="Accueil"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
          />
        </Link>
      </div>
    </div>
  )
}
