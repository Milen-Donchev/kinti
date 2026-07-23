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
  tagline,
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
              compact ? 'text-lg leading-5' : 'text-xl leading-6',
            )}
          >
            {wordmark}
          </p>
          {tagline ? (
            <p className="truncate text-xs font-semibold text-[rgb(var(--muted-foreground))]">
              {tagline}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function LevkoMark({ className }: { className?: string }) {
  return (
    <img
      className={cn('h-14 w-14 shrink-0 object-contain', className)}
      src="/levko-logo.png"
      alt="Levko"
      width="56"
      height="56"
    />
  )
}
