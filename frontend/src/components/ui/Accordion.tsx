import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Accordion({ items, className }: { items: { question: string; answer: ReactNode }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className={cn('divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white', className)}>
      {items.map((item, index) => {
        const isOpen = open === index
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink-800 transition hover:bg-ink-50/50"
              >
                {item.question}
                <ChevronDown
                  aria-hidden
                  className={cn('size-4 shrink-0 text-ink-400 transition-transform duration-200', isOpen && 'rotate-180')}
                />
              </button>
            </h3>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-[13px] leading-6 text-ink-500">{item.answer}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
