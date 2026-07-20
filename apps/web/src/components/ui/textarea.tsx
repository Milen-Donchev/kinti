import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full resize-none rounded-xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3 text-sm font-semibold text-[rgb(var(--foreground))] outline-none transition-colors placeholder:font-medium placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent-soft))]',
        className,
      )}
      {...props}
    />
  )
}
