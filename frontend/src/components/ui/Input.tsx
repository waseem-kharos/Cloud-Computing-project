import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FieldShellProps {
  id: string
  label?: ReactNode
  error?: string
  hint?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
  labelClassName?: string
}

function FieldShell({ id, label, error, hint, required, children, className, labelClassName }: FieldShellProps) {
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label htmlFor={id} className={cn('mb-1.5 block text-[13px] font-semibold text-ink-700', labelClassName)}>
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const controlBase =
  'w-full rounded-xl border bg-white text-sm text-ink-900 shadow-[0_1px_1px_rgb(15_43_70_/_0.02)] transition placeholder:text-ink-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400'

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  icon?: ReactNode
  rightSlot?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, rightSlot, className, containerClassName, id, required, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">{icon}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            controlBase,
            'h-11 px-3.5',
            icon && 'pl-10',
            rightSlot && 'pr-11',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
              : 'border-line hover:border-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
            className,
          )}
          {...props}
        />
        {rightSlot ? <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span> : null}
      </div>
    </FieldShell>
  )
})

export interface TextareaProps extends ComponentPropsWithoutRef<'textarea'> {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, containerClassName, id, required, rows = 4, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(
          controlBase,
          'min-h-24 resize-y px-3.5 py-2.5',
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
            : 'border-line hover:border-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
          className,
        )}
        {...props}
      />
    </FieldShell>
  )
})

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, containerClassName, id, required, children, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={required} className={containerClassName}>
      <select
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(
          controlBase,
          'h-11 appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat px-3.5 pr-10',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b87a6' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
            : 'border-line hover:border-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
})

export function Checkbox({
  label,
  error,
  className,
  id,
  ...props
}: ComponentPropsWithoutRef<'input'> & { label: ReactNode; error?: string }) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        <input
          id={inputId}
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-ink-300 text-brand-600 accent-brand-600 focus:ring-brand-200"
          aria-invalid={Boolean(error) || undefined}
          {...props}
        />
        <label htmlFor={inputId} className="text-[13px] leading-5 text-ink-600">
          {label}
        </label>
      </div>
      {error ? <p className="mt-1 pl-6 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  )
}
