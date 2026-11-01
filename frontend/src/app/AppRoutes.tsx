import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireSection } from '@/components/guards'
import { Layout } from '@/components/layout/Layout'
import { lazyNamed } from '@/lib/lazy'
import { registerPrefetch } from '@/lib/routePrefetch'

// Chaque écran est un chunk séparé : le shell de l'application et la page
// demandée sont les seuls code chargés au démarrage.
// On garde une référence sur chaque loader `import()` pour pouvoir pré-charger
// le chunk au survol des liens du menu (voir src/lib/routePrefetch.ts).
const loadHomePage = () => import('@/pages/HomePage')
const HomePage = lazyNamed(loadHomePage, 'HomePage')
registerPrefetch('/', loadHomePage)

const loadLoginPage = () => import('@/pages/LoginPage')
const LoginPage = lazyNamed(loadLoginPage, 'LoginPage')
registerPrefetch('/login', loadLoginPage)

const loadNotFoundPage = () => import('@/pages/NotFoundPage')
const NotFoundPage = lazyNamed(loadNotFoundPage, 'NotFoundPage')

const loadDashboardPage = () => import('@/pages/DashboardPage')
const DashboardPage = lazyNamed(loadDashboardPage, 'DashboardPage')
registerPrefetch('/dashboard', loadDashboardPage)

const loadMembersPage = () => import('@/pages/membres/MembersPage')
const MembersPage = lazyNamed(loadMembersPage, 'MembersPage')
registerPrefetch('/membres', loadMembersPage)

const loadFinancePage = () => import('@/pages/finance/FinancePage')
const FinancePage = lazyNamed(loadFinancePage, 'FinancePage')
registerPrefetch('/finance', loadFinancePage)

const loadDevoirsPage = () => import('@/pages/devoirs/DevoirsPage')
const DevoirsPage = lazyNamed(loadDevoirsPage, 'DevoirsPage')
registerPrefetch('/devoirs', loadDevoirsPage)

const loadPlanningPage = () => import('@/pages/planning/PlanningPage')
const PlanningPage = lazyNamed(loadPlanningPage, 'PlanningPage')
registerPrefetch('/planning', loadPlanningPage)

const loadAnnoncesPage = () => import('@/pages/annonces/AnnoncesPage')
const AnnoncesPage = lazyNamed(loadAnnoncesPage, 'AnnoncesPage')
registerPrefetch('/annonces', loadAnnoncesPage)

const loadFormateursPage = () => import('@/pages/formateurs/FormateursPage')
const FormateursPage = lazyNamed(loadFormateursPage, 'FormateursPage')
registerPrefetch('/formateurs', loadFormateursPage)

const loadModulesPage = () => import('@/pages/modules/ModulesPage')
const ModulesPage = lazyNamed(loadModulesPage, 'ModulesPage')
registerPrefetch('/modules', loadModulesPage)

const loadPresencesPage = () => import('@/pages/presences/PresencesPage')
const PresencesPage = lazyNamed(loadPresencesPage, 'PresencesPage')
registerPrefetch('/presences', loadPresencesPage)

const loadParametresPage = () => import('@/pages/parametres/ParametresPage')
const ParametresPage = lazyNamed(loadParametresPage, 'ParametresPage')
registerPrefetch('/parametres', loadParametresPage)

export function AppRoutes() {
  return (
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
            <RequireSection section="membres">
              <MembersPage />
            </RequireSection>
          }
        />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/devoirs" element={<DevoirsPage />} />
        <Route
          path="/planning"
          element={
            <RequireSection section="planning">
              <PlanningPage />
            </RequireSection>
          }
        />
        <Route path="/annonces" element={<AnnoncesPage />} />
        <Route
          path="/formateurs"
          element={
            <RequireSection section="formateurs">
              <FormateursPage />
            </RequireSection>
          }
        />
        <Route
          path="/modules"
          element={
            <RequireSection section="modules">
              <ModulesPage />
            </RequireSection>
          }
        />
        <Route
          path="/presences"
          element={
            <RequireSection section="presences">
              <PresencesPage />
            </RequireSection>
          }
        />
        <Route path="/parametres" element={<ParametresPage />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
