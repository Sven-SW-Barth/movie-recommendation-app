'use client'

import type { Mood } from '@/app/actions/app'
import { MoodIcon } from '@/components/mood-icon'
import { StatsBars } from '@/components/stats-bars'
import { Button } from '@/components/ui/button'
import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MoodsTab({
  moods,
  activeMood,
  stats,
  switching,
  onSwitch,
  onReset,
  onAddMood,
  onDelete,
}: {
  moods: Mood[] | undefined
  activeMood: string
  stats: Record<string, number>
  switching: boolean
  onSwitch: (moodId: string) => void
  onReset: () => void
  onAddMood: () => void
  onDelete: (moodId: string) => void
}) {
  const list = moods ?? []
  const active = list.find((m) => m.moodId === activeMood)

  return (
    <div className="flex flex-col px-5 pb-4">
      <header className="border-b border-foreground pb-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">The Index</p>
          <p className="eyebrow">
            {list.length} {list.length === 1 ? 'profile' : 'profiles'}
          </p>
        </div>
        <h1 className="mt-2 font-display text-4xl font-bold leading-none">
          Your <span className="italic font-medium">moods</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Each mood is its own taste profile, built from a chat. Training
          changes only the active one — switch anytime.
        </p>
      </header>

      <button
        type="button"
        onClick={onAddMood}
        className="mt-4 flex items-center justify-between border border-foreground bg-primary px-4 py-3.5 text-primary-foreground transition-opacity hover:opacity-90"
      >
        <span className="font-display text-lg font-bold">Create a new mood</span>
        <Plus className="size-5" aria-hidden="true" />
      </button>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {list.map((mood, i) => {
          const isActive = mood.moodId === activeMood
          return (
            <li key={mood.moodId} className="flex items-stretch">
              <button
                type="button"
                disabled={switching}
                onClick={() => !isActive && onSwitch(mood.moodId)}
                aria-pressed={isActive}
                className={cn(
                  'flex flex-1 items-center gap-4 p-3.5 text-left transition-colors disabled:opacity-60',
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
                <MoodIcon name={mood.icon} className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-lg font-bold leading-tight">
                      {mood.name}
                    </span>
                    {isActive && (
                      <span className="flex shrink-0 items-center gap-1 border border-primary-foreground/40 px-1.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
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
                    {mood.swipeCount > 0
                      ? `${mood.swipeCount} ${mood.swipeCount === 1 ? 'review' : 'reviews'} · trained`
                      : 'Not trained yet'}
                  </span>
                </span>
              </button>
              {list.length > 1 && (
                <button
                  type="button"
                  disabled={switching}
                  onClick={() => onDelete(mood.moodId)}
                  aria-label={`Delete ${mood.name}`}
                  className={cn(
                    'flex w-12 shrink-0 items-center justify-center border-l transition-colors disabled:opacity-60',
                    isActive
                      ? 'border-primary-foreground/30 bg-primary text-primary-foreground/70 hover:text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {active && (
        <section className="mt-10 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <h2 className="max-w-[60%] truncate eyebrow">
              {active.name} profile
            </h2>
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
      )}
    </div>
  )
}
