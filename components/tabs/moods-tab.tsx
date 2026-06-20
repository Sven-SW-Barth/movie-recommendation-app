'use client'

import { moods, getMood } from '@/lib/catalog'
import type { MoodSummary } from '@/app/actions/app'
import { MoodIcon } from '@/components/mood-icon'
import { StatsBars } from '@/components/stats-bars'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <header className="pt-6">
        <h1 className="font-display text-2xl font-bold">Your moods</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each mood is a separate taste profile. Training only changes the
          active one — switch anytime.
        </p>
      </header>

      <ul className="mt-5 flex flex-col gap-2.5">
        {moods.map((mood) => {
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
                  'flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors disabled:opacity-60',
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:bg-accent',
                )}
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground',
                  )}
                >
                  <MoodIcon name={mood.emoji} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display font-semibold">
                      {mood.label}
                    </span>
                    {isActive && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Check className="size-3" aria-hidden="true" />
                        Active
                      </Badge>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {count > 0
                      ? `${count} ${count === 1 ? 'rating' : 'ratings'} · trained`
                      : 'Not trained yet'}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {active?.label} profile
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <StatsBars stats={stats} />
        </div>
      </section>
    </div>
  )
}
