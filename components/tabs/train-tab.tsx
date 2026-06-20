'use client'

import { useMemo, useState } from 'react'
import { movies, getMood } from '@/lib/catalog'
import { SwipeCard } from '@/components/swipe-card'
import { StatsBars } from '@/components/stats-bars'
import { Button } from '@/components/ui/button'
import { Heart, X, RotateCcw, CheckCircle2 } from 'lucide-react'

export function TrainTab({
  activeMood,
  stats,
  swipedMovieIds,
  onSwipe,
  onReset,
}: {
  activeMood: string
  stats: Record<string, number>
  swipedMovieIds: string[]
  onSwipe: (movieId: string, liked: boolean) => void
  onReset: () => void
}) {
  const mood = getMood(activeMood)
  const swiped = useMemo(() => new Set(swipedMovieIds), [swipedMovieIds])
  const deck = useMemo(
    () => movies.filter((m) => !swiped.has(m.id)),
    [swiped],
  )
  const [buttonExit, setButtonExit] = useState(false)

  const current = deck[0]
  const next = deck[1]
  const done = deck.length === 0

  function fire(liked: boolean) {
    if (!current) return
    setButtonExit(true)
    onSwipe(current.id, liked)
    setTimeout(() => setButtonExit(false), 250)
  }

  return (
    <div className="flex flex-col px-5 pb-4">
      <header className="pt-6">
        <h1 className="font-display text-2xl font-bold">Train your taste</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Swipe right to like, left to skip. You&apos;re tuning the{' '}
          <span className="font-medium text-primary">{mood?.label}</span>{' '}
          profile.
        </p>
      </header>

      {done ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center">
          <CheckCircle2 className="size-10 text-like" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-semibold">
            All caught up
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ve rated every movie for this mood. Check your
            recommendations, or reset to train again.
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={onReset}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset this mood
          </Button>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-6 aspect-[2/3] w-full max-w-[340px]">
            {/* peek of next card */}
            {next ? (
              <div className="absolute inset-0 scale-[0.94] translate-y-3 overflow-hidden rounded-3xl border border-border bg-card opacity-60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={next.cover || '/placeholder.svg'}
                  alt=""
                  className="h-full w-full object-cover"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-background/30" />
              </div>
            ) : null}

            <SwipeCard
              key={current.id}
              movie={current}
              onSwipe={(liked) => onSwipe(current.id, liked)}
              disabled={buttonExit}
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <Button
              size="icon"
              variant="outline"
              aria-label="Skip this movie"
              onClick={() => fire(false)}
              className="size-16 rounded-full border-dislike/40 text-dislike hover:bg-dislike/10 hover:text-dislike"
            >
              <X className="size-7" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              aria-label="Like this movie"
              onClick={() => fire(true)}
              className="size-16 rounded-full bg-like text-like-foreground hover:bg-like/90"
            >
              <Heart className="size-7" aria-hidden="true" />
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {deck.length} {deck.length === 1 ? 'movie' : 'movies'} left ·{' '}
            {swipedMovieIds.length} rated
          </p>
        </>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Live preferences · {mood?.label}
        </h2>
        <StatsBars stats={stats} />
      </section>
    </div>
  )
}
