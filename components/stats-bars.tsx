'use client'

import { categories } from '@/lib/catalog'
import { cn } from '@/lib/utils'

export function StatsBars({
  stats,
  className,
}: {
  stats: Record<string, number>
  className?: string
}) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {categories.map((cat) => {
        const value = Math.round((stats[cat.id] ?? 50) * 10) / 10
        return (
          <li key={cat.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">
                {cat.label}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {value.toFixed(1)}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={cat.label}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${value}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
