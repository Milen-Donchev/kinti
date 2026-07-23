import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 text-xs font-extrabold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-[#16a063] bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] shadow-[0_5px_0_#16a063] hover:brightness-105 active:brightness-95 dark:border-[#1db86f] dark:shadow-[0_5px_0_#0f7f50]',
        secondary:
          'border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--foreground))] shadow-[0_5px_0_rgb(var(--border))] hover:bg-[rgb(var(--surface-subtle))] active:brightness-95',
        ghost:
          'border-transparent text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--foreground))]',
        danger:
          'border-rose-600 bg-[rgb(var(--danger))] text-white shadow-[0_5px_0_rgb(190_18_60)] hover:brightness-105 active:brightness-95',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-5 text-sm',
        icon: 'h-10 w-10 px-0',
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
