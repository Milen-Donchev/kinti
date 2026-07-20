import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-5 text-sm font-extrabold uppercase tracking-wide transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-[#16a063] bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] shadow-[0_5px_0_#16a063] hover:translate-y-0.5 hover:shadow-[0_3px_0_#16a063] active:translate-y-1 active:shadow-none dark:border-[#1db86f] dark:shadow-[0_5px_0_#0f7f50] dark:hover:shadow-[0_3px_0_#0f7f50]',
        secondary:
          'border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] shadow-[0_5px_0_rgb(var(--border))] hover:translate-y-0.5 hover:bg-[rgb(var(--surface-subtle))] hover:shadow-[0_3px_0_rgb(var(--border))] active:translate-y-1 active:shadow-none',
        ghost:
          'border-transparent text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--foreground))]',
        danger:
          'border-rose-600 bg-[rgb(var(--danger))] text-white shadow-[0_5px_0_rgb(190_18_60)] hover:translate-y-0.5 hover:shadow-[0_3px_0_rgb(190_18_60)] active:translate-y-1 active:shadow-none',
      },
      size: {
        sm: 'h-10 px-4 text-xs',
        md: 'h-11 px-5',
        lg: 'h-13 px-6',
        icon: 'h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'

  return (
    <Component
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
