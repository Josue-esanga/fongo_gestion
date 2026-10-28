import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { Layout } from '@/components/Layout'
import { RequireAuth, RequireRole } from '@/components/guards'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import type { Role } from '@/types'

// Les pages protégées sont chargées à la demande : le bundle initial reste
// léger et chaque écran n'est téléchargé qu'à sa première visite.
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const MembersPage = lazy(() =>
  import('@/pages/membres/MembersPage').then((m) => ({ default: m.MembersPage })),
)
const FinancePage = lazy(() =>
  import('@/pages/finance/FinancePage').then((m) => ({ default: m.FinancePage })),
)
const DevoirsPage = lazy(() =>
  import('@/pages/devoirs/DevoirsPage').then((m) => ({ default: m.DevoirsPage })),
)
const PlanningPage = lazy(() =>
  import('@/pages/planning/PlanningPage').then((m) => ({ default: m.PlanningPage })),
)
const AnnoncesPage = lazy(() =>
  import('@/pages/annonces/AnnoncesPage').then((m) => ({ default: m.AnnoncesPage })),
)
const FormateursPage = lazy(() =>
  import('@/pages/formateurs/FormateursPage').then((m) => ({
    default: m.FormateursPage,
  })),
)
const ParametresPage = lazy(() =>
  import('@/pages/parametres/ParametresPage').then((m) => ({
    default: m.ParametresPage,
  })),
)

const ADMIN_ROLES: Role[] = ['admin', 'super_admin']

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/membres"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <MembersPage />
              </RequireRole>
            }
          />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/devoirs" element={<DevoirsPage />} />
          <Route
            path="/planning"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <PlanningPage />
              </RequireRole>
            }
          />
          <Route path="/annonces" element={<AnnoncesPage />} />
          <Route
            path="/formateurs"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <FormateursPage />
              </RequireRole>
            }
          />
          <Route path="/parametres" element={<ParametresPage />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <ConfirmDialog />
    </>
  )
}
