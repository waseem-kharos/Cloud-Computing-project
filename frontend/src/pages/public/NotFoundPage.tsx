import { Compass, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClasses } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useDocumentTitle } from '@/hooks/useUtils'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <Logo className="justify-center" />
        <p className="mt-8 text-7xl font-bold tracking-tight text-ink-100">404</p>
        <h1 className="-mt-2 text-xl font-bold text-ink-950">This page could not be found</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          The link may be outdated, or the page may have moved. Head back to the public site or your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/" className={buttonClasses('primary', 'md')}>
            <Home className="size-4" /> Home
          </Link>
          <Link to="/doctors" className={buttonClasses('outline', 'md')}>
            <Compass className="size-4" /> Find a doctor
          </Link>
        </div>
      </div>
    </div>
  )
}
