import { Suspense } from 'react'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { AppRoutes } from '@/app/AppRoutes'
import { LoadingScreen } from '@/components/Feedback'

export default function App() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-white">
            <LoadingScreen label="Chargement de la page…" />
          </div>
        }
      >
        <AppRoutes />
      </Suspense>

      <ConfirmDialog />
    </>
  )
}
