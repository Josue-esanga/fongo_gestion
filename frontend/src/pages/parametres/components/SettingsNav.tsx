import type { SettingsTab } from '../types'
import { Icon } from '@/components/Icon'

export function SettingsNav({
  tab,
  onChange,
}: {
  tab: SettingsTab
  onChange: (tab: SettingsTab) => void
}) {
  return (
    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('profil')}
        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
          tab === 'profil'
            ? 'bg-fongo-50 text-fongo-900'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Icon className="pi pi-user" />
        Mon profil
      </button>
      <button
        type="button"
        onClick={() => onChange('securite')}
        className={`mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
          tab === 'securite'
            ? 'bg-fongo-50 text-fongo-900'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <Icon className="pi pi-lock" />
        Sécurité
      </button>
    </aside>
  )
}
