import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'

import { cn } from '@/lib/cn'

export function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn('p-1', className)}
      classNames={{
        root: 'w-full',
        months: 'flex flex-col gap-4',
        month: 'space-y-3',
        month_caption: 'flex h-10 items-center justify-center px-10',
        caption_label: 'text-sm font-extrabold',
        nav: 'absolute inset-x-0 top-4 flex items-center justify-between px-4',
        button_previous:
          'grid h-9 w-9 place-items-center rounded-xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--muted-foreground))] shadow-[0_3px_0_rgb(var(--border))] transition-all hover:translate-y-0.5 hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--foreground))] hover:shadow-[0_2px_0_rgb(var(--border))] active:translate-y-1 active:shadow-none',
        button_next:
          'grid h-9 w-9 place-items-center rounded-xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--muted-foreground))] shadow-[0_3px_0_rgb(var(--border))] transition-all hover:translate-y-0.5 hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--foreground))] hover:shadow-[0_2px_0_rgb(var(--border))] active:translate-y-1 active:shadow-none',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'grid grid-cols-7',
        weekday:
          'grid h-8 place-items-center text-xs font-extrabold uppercase text-[rgb(var(--muted))]',
        week: 'grid grid-cols-7',
        day: 'grid h-10 w-10 place-items-center p-0 text-sm',
        day_button:
          'grid h-10 w-10 place-items-center rounded-xl border-2 border-transparent font-extrabold transition-all hover:-translate-y-0.5 hover:border-[#35b9ff] hover:bg-[#e2f6ff] hover:text-[#1688c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] dark:hover:bg-[#15334a] dark:hover:text-cyan-100',
        today:
          '[&>button]:border-[#ffd45a] [&>button]:bg-[#fff4ce] [&>button]:text-[#8a6414] dark:[&>button]:bg-[#493919] dark:[&>button]:text-[#ffd45a]',
        selected:
          '[&>button]:border-[#16a063] [&>button]:bg-[#29c776] [&>button]:text-white [&>button]:shadow-[0_4px_0_#16a063] [&>button]:hover:bg-[#29c776] [&>button]:hover:text-white dark:[&>button]:border-[#1db86f] dark:[&>button]:shadow-[0_4px_0_#0f7f50]',
        outside: 'text-[rgb(var(--muted))] opacity-45',
        disabled: 'text-[rgb(var(--muted))] opacity-35',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          ),
      }}
      {...props}
    />
  )
}
