import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 text-sm font-semibold text-[rgb(var(--foreground))] outline-none transition-colors placeholder:font-medium placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent-soft))]',
        className,
      )}
      {...props}
    />
  )
}
