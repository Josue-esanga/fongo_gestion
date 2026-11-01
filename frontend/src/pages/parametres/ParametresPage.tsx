import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileTab } from './components/ProfileTab'
import { SecurityTab } from './components/SecurityTab'
import { SettingsNav } from './components/SettingsNav'
import type { SettingsTab } from './types'

export function ParametresPage() {
  const { user, isStagiaire } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: SettingsTab =
    searchParams.get('tab') === 'securite' ? 'securite' : 'profil'

  function changeTab(next: SettingsTab) {
    setSearchParams(next === 'profil' ? {} : { tab: next }, { replace: true })
  }

  if (!user) return null

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Compte"
        title="Paramètres"
        subtitle={
          isStagiaire
            ? 'Consultez vos informations personnelles et changez votre photo de profil.'
            : 'Gérez vos informations personnelles et la sécurité de votre compte FongoGestion.'
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SettingsNav tab={tab} onChange={changeTab} />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {tab === 'profil' ? (
            <ProfileTab user={user} isStagiaire={isStagiaire} />
          ) : (
            <SecurityTab />
          )}
        </section>
      </div>
    </div>
  )
}
