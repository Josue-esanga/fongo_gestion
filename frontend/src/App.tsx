import { Suspense, useState } from 'react'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { AppRoutes } from '@/app/AppRoutes'
import { LoaderDots } from '@/components/LoaderDots'
import { OptimizedImage } from '@/components/OptimizedImage'
import { SplashScreen } from '@/components/SplashScreen'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Suspense
        fallback={
          <div
            className="fixed inset-0 z-[50] flex flex-col items-center justify-center gap-5 bg-fongo-950 text-white"
            role="status"
            aria-live="polite"
          >
            <OptimizedImage
              src="/images/logo.svg"
              alt=""
              className="h-16 w-16 rounded-2xl ring-1 ring-white/15"
              width={64}
              height={64}
              loading="eager"
              plain
            />
            <span className="sr-only">Chargement de la page…</span>
            <LoaderDots className="text-2xl text-cyan-300" />
          </div>
        }
      >
        <AppRoutes />
      </Suspense>

      <ConfirmDialog />
    </>
  )
}
