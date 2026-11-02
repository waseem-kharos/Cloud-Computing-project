import { AlertOctagon } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
            <AlertOctagon className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-ink-900">This page hit an unexpected error</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Your data is safe. Reload the page to continue, or return to the home page.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Reload page</Button>
            <Button variant="outline" onClick={() => { window.location.href = '/' }}>
              Go home
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
