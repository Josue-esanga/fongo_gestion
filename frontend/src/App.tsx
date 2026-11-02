import { Suspense, useState } from 'react'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { AppRoutes } from '@/app/AppRoutes'
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
          <div className="fixed inset-0 z-[50] flex items-center justify-center bg-[#03045e]">
            <div className="flex flex-col items-center justify-center gap-4 text-white">
              <img
                src="/images/fongolab.jpg"
                alt="Logo FongoLab"
                className="w-16 h-16 rounded-full"
              />
              <p className="text-sm font-medium">Chargement de la page…</p>
            </div>
          </div>
        }
      >
        <AppRoutes />
      </Suspense>

      <ConfirmDialog />
    </>
  )
}
