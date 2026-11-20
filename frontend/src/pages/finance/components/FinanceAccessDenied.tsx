import { EmptyState } from '@/components/Feedback'
import { PageHeader } from '@/components/PageHeader'

export function FinanceAccessDenied() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Gestion financière"
        title="Finance"
        subtitle="Les finances du club : versements des stagiaires et suivi de la trésorerie."
      />
      <EmptyState
        icon="pi pi-lock"
        title="Page indisponible"
        description="Cette section n'est pas disponible pour votre compte. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur."
      />
    </div>
  )
}
