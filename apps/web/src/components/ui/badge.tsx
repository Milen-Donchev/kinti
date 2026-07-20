import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-[rgb(var(--accent-soft))] px-2 py-1 text-xs font-medium text-[rgb(var(--accent))]',
        className,
      )}
      {...props}
    />
  )
}
