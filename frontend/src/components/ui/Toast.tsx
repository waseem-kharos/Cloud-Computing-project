import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  success: 'border-mint-200 bg-white text-mint-700',
  error: 'border-rose-200 bg-white text-rose-600',
  info: 'border-brand-200 bg-white text-brand-700',
  warning: 'border-amber-200 bg-white text-amber-700',
}

const toneIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    counter.current += 1
    const item: ToastItem = {
      id: counter.current,
      title: input.title,
      description: input.description,
      tone: input.tone || 'success',
    }
    setItems((current) => [...current.slice(-3), item])
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:top-5 sm:w-full sm:max-w-sm"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = toneIcons[item.tone]

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5200)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full animate-fade-up items-start gap-3 rounded-xl border p-3.5 shadow-lift',
        toneStyles[item.tone],
      )}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink-900">{item.title}</p>
        {item.description ? <p className="mt-0.5 text-xs leading-5 text-ink-500">{item.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
