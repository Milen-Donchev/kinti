import { format } from 'date-fns'
import { bg, enUS, es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Language } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'

type DatePickerProps = {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder: string
  language: Language
  disabled?: boolean
}

const locales = {
  bg,
  en: enUS,
  es,
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  language,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedDate = useMemo(() => parseDateValue(value), [value])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'h-11 w-full justify-start rounded-xl border-2 bg-[rgb(var(--surface))] text-left font-extrabold normal-case tracking-normal shadow-[0_4px_0_rgb(var(--border))] hover:bg-[#e2f6ff] dark:hover:bg-[#15334a]',
            !selectedDate && 'text-[rgb(var(--muted))]',
          )}
          id={id}
          type="button"
          variant="secondary"
          disabled={disabled}
        >
          <CalendarIcon size={17} />
          {selectedDate
            ? format(selectedDate, 'PPP', { locale: locales[language] })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) {
              return
            }

            onChange(formatDateValue(date))
            setIsOpen(false)
          }}
          locale={locales[language]}
          weekStartsOn={1}
        />
      </PopoverContent>
    </Popover>
  )
}

function parseDateValue(value?: string) {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
