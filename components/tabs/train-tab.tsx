'use client'

import { useMemo, useState } from 'react'
import { buildTrainingQueue } from '@/lib/catalog'
import { SwipeCard } from '@/components/swipe-card'
import { StatsBars } from '@/components/stats-bars'
import { Button } from '@/components/ui/button'
import { Heart, X, RotateCcw, CheckCircle2 } from 'lucide-react'

export function TrainTab({
  moodName,
  stats,
  swipedMovieIds,
  onSwipe,
  onReset,
}: {
  moodName: string
  stats: Record<string, number>
  swipedMovieIds: string[]
  onSwipe: (movieId: string, liked: boolean) => void
  onReset: () => void
}) {
  const swiped = useMemo(() => new Set(swipedMovieIds), [swipedMovieIds])
  const deck = useMemo(
    () => buildTrainingQueue(stats).filter((m) => !swiped.has(m.id)),
    [stats, swiped],
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
      <header className="border-b border-border pb-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">The Screening Room</p>
          <p className="max-w-[55%] truncate eyebrow">{moodName}</p>
        </div>
        <h1 className="mt-2 font-display text-4xl font-bold leading-none">
          Train your <span className="italic font-medium">taste</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Swipe right for yes, left to pass. Each verdict tunes this profile.
        </p>
      </header>

      {done ? (
        <div className="mt-8 flex flex-col items-center border border-foreground bg-card p-8 text-center">
          <CheckCircle2 className="size-10 text-like" aria-hidden="true" />
          <h2 className="mt-3 font-display text-2xl font-bold">
            That&apos;s a wrap
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ve reviewed every film for this mood. See your picks, or
            reset the reel to train again.
          </p>
          <Button
            variant="outline"
            className="mt-5 rounded-none uppercase tracking-[0.14em]"
            onClick={onReset}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset this mood
          </Button>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-7 aspect-[2/3] w-full max-w-[340px]">
            {/* peek of next card */}
            {next ? (
              <div className="absolute inset-0 translate-x-2 translate-y-2 overflow-hidden border border-foreground bg-card opacity-50">
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

          <div className="mt-8 flex items-center justify-center gap-6">
            <Button
              size="icon"
              variant="outline"
              aria-label="Pass on this movie"
              onClick={() => fire(false)}
              className="size-16 rounded-none border-dislike text-dislike hover:bg-dislike hover:text-dislike-foreground"
            >
              <X className="size-7" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              aria-label="Like this movie"
              onClick={() => fire(true)}
              className="size-16 rounded-none bg-like text-like-foreground hover:bg-like/90"
            >
              <Heart className="size-7" aria-hidden="true" />
            </Button>
          </div>

          <p className="mt-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {deck.length} {deck.length === 1 ? 'film' : 'films'} left ·{' '}
            {swipedMovieIds.length} reviewed
          </p>
        </>
      )}

      <section className="mt-10 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Live taste profile</h2>
          <span className="max-w-[55%] truncate eyebrow">{moodName}</span>
        </div>
        <div className="mt-4">
          <StatsBars stats={stats} />
        </div>
      </section>
    </div>
  )
}
