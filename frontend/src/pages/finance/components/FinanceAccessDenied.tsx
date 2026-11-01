import { EmptyState } from '@/components/Feedback'
import { PageHeader } from '@/components/PageHeader'

export function FinanceAccessDenied() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Gestion financière"
        title="Finance"
        subtitle="Suivez les versements des stagiaires, analysez les recettes et gardez une vision claire de la trésorerie du club."
      />
      <EmptyState
        icon="pi pi-lock"
        title="Accès réservé"
        description="La section Finance est réservée aux caissiers et au super administrateur. Demandez le rôle caissier pour y accéder."
      />
    </div>
  )
}
