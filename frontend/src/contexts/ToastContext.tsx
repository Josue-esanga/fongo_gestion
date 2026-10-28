import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { Toast } from 'primereact/toast'

type Severity = 'success' | 'info' | 'warn' | 'error'

interface ToastContextValue {
  showToast: (severity: Severity, summary: string, detail?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useRef<Toast>(null)

  const showToast = useCallback(
    (severity: Severity, summary: string, detail?: string) => {
      toast.current?.show({
        severity,
        summary,
        detail,
        life: 3800,
      })
    },
    [],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast ref={toast} position="top-right" />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast doit être utilisé dans <ToastProvider />')
  }
  return context
}
