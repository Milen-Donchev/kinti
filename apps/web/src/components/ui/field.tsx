import type { LabelHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type FieldProps = {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <label
        className="pl-2 text-sm font-extrabold text-[rgb(var(--foreground))]"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {error ? (
        <span className="pl-2 text-sm text-[rgb(var(--danger))]">{error}</span>
      ) : null}
    </div>
  )
}

export function InlineLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm transition-colors hover:bg-[rgb(var(--surface-subtle))]',
        className,
      )}
      {...props}
    />
  )
}
