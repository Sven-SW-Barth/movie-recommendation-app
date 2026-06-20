'use client'

import { moods, getMood } from '@/lib/catalog'
import type { MoodSummary } from '@/app/actions/app'
import { MoodIcon } from '@/components/mood-icon'
import { StatsBars } from '@/components/stats-bars'
import { Button } from '@/components/ui/button'
import { Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MoodsTab({
  activeMood,
  stats,
  summaries,
  switching,
  onSwitch,
  onReset,
}: {
  activeMood: string
  stats: Record<string, number>
  summaries: MoodSummary[] | undefined
  switching: boolean
  onSwitch: (moodId: string) => void
  onReset: () => void
}) {
  const active = getMood(activeMood)

  function countFor(id: string) {
    return summaries?.find((s) => s.id === id)?.swipeCount ?? 0
  }

  return (
    <div className="flex flex-col px-5 pb-4">
      <header className="border-b border-border pb-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">The Index</p>
          <p className="eyebrow">{moods.length} profiles</p>
        </div>
        <h1 className="mt-2 font-display text-4xl font-bold leading-none">
          Your <span className="italic font-medium">moods</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Each mood is its own taste profile. Training changes only the active
          one — switch anytime.
        </p>
      </header>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {moods.map((mood, i) => {
          const isActive = mood.id === activeMood
          const count = countFor(mood.id)
          return (
            <li key={mood.id}>
              <button
                type="button"
                disabled={switching}
                onClick={() => !isActive && onSwitch(mood.id)}
                aria-pressed={isActive}
                className={cn(
                  'flex w-full items-center gap-4 p-3.5 text-left transition-colors disabled:opacity-60',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent',
                )}
              >
                <span
                  className={cn(
                    'index-numeral w-7 shrink-0 text-xl',
                    isActive
                      ? 'text-primary-foreground/60'
                      : 'text-muted-foreground',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <MoodIcon name={mood.emoji} className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold leading-tight">
                      {mood.label}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-1 border border-primary-foreground/40 px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
                        <Check className="size-2.5" aria-hidden="true" />
                        Active
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block truncate text-xs',
                      isActive
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground',
                    )}
                  >
                    {count > 0
                      ? `${count} ${count === 1 ? 'review' : 'reviews'} · trained`
                      : 'Not trained yet'}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <section className="mt-10 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">{active?.label} profile</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-auto rounded-none p-0 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
          </Button>
        </div>
        <div className="mt-4">
          <StatsBars stats={stats} />
        </div>
      </section>
    </div>
  )
}
