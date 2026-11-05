import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import './index.css'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import App from './App'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'

dayjs.locale('fr')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes : les données sont considérées fraîches pendant cette durée,
      // ce qui évite les refetch inutiles (auth/me, dashboard, listes, etc.)
      staleTime: 5 * 60_000,
      // On garde le cache 10 minutes après le démontage du dernier composant.
      gcTime: 10 * 60_000,
      // On ne réessaie pas les erreurs client (400, 401, 403, 404…),
      // mais on retente les erreurs réseau et serveur.
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status && status >= 400 && status < 500) return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
