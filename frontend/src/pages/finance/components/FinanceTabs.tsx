import type { FinanceTab } from '../types'
import { Icon } from '@/components/Icon'

export function FinanceTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ key: FinanceTab; label: string; icon: string }>
  active: FinanceTab
  onChange: (tab: FinanceTab) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      {tabs.map((item) => (
        <button type="button"
          key={item.key}
          
          onClick={() => onChange(item.key)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === item.key
              ? 'bg-fongo-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Icon className={`${item.icon} text-xs`} />
          {item.label}
        </button>
      ))}
    </div>
  )
}
