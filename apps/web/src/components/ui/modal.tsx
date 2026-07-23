import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { cn } from '@/lib/cn'

type ModalProps = {
  title: string
  description?: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  closeLabel?: string
}

export function Modal({
  title,
  description,
  isOpen,
  onClose,
  children,
  className,
  closeLabel = 'Close',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-slate-950/28 p-0 backdrop-blur-sm dark:bg-black/60 sm:place-items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        className="absolute inset-0 h-full w-full cursor-default"
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <section
        className={cn(
          'relative max-h-[92vh] w-full overflow-hidden rounded-t-3xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[0_8px_0_rgb(var(--border))] sm:max-w-2xl sm:rounded-3xl',
          className,
        )}
      >
        <div className="h-2 bg-gradient-to-r from-[#29c776] via-[#35b9ff] to-[#ff6b7a]" />
        <header className="flex items-start justify-between gap-4 border-b-2 border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] px-4 py-3.5">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-extrabold tracking-normal">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--muted-foreground))] shadow-[0_4px_0_rgb(var(--border))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--foreground))]"
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[calc(92vh-78px)] overflow-y-auto px-4 py-4">
          {children}
        </div>
      </section>
    </div>
  )
}
