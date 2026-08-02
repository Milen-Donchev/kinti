import { cn } from '@/lib/cn'

type BrandLogoProps = {
  className?: string
  markClassName?: string
  wordmark?: string
  tagline?: string
  showWordmark?: boolean
  compact?: boolean
}

export function BrandLogo({
  className,
  markClassName,
  wordmark,
  showWordmark = true,
  compact = false,
}: BrandLogoProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <LevkoMark className={markClassName} />

      {showWordmark ? (
        <div className="min-w-0">
          <p
            className={cn(
              'levko-wordmark truncate text-[rgb(var(--foreground))]',
              compact ? 'text-xl leading-6' : 'text-2xl leading-7',
            )}
          >
            {wordmark}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function LevkoMark({ className }: { className?: string }) {
  return (
    <img
      className={cn('h-16 w-16 shrink-0 object-contain', className)}
      src="/levko-logo.png"
      alt="Levko"
      width="64"
      height="64"
    />
  )
}
