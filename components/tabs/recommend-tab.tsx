'use client'

import { useMemo } from 'react'
import { movies, getMood, matchScore } from '@/lib/catalog'
import { MoodIcon } from '@/components/mood-icon'
import { Badge } from '@/components/ui/badge'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RecommendTab({
  activeMood,
  stats,
  swipeCount,
  onGoTrain,
}: {
  activeMood: string
  stats: Record<string, number>
  swipeCount: number
  onGoTrain: () => void
}) {
  const mood = getMood(activeMood)

  const ranked = useMemo(() => {
    return [...movies]
      .map((m) => ({ movie: m, score: matchScore(stats, m) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
  }, [stats])

  const top = ranked[0]

  return (
    <div className="flex flex-col px-5 pb-4">
      <header className="pt-6">
        <div className="flex items-center gap-2 text-primary">
          <MoodIcon name={mood?.emoji ?? 'heart'} className="size-4" />
          <span className="text-sm font-medium">{mood?.label}</span>
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold">For You</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ranked by how closely each movie matches your{' '}
          {mood?.label.toLowerCase()} taste.
        </p>
      </header>

      {swipeCount < 3 && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <Layers className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="flex-1 text-sm text-foreground">
            Swipe a few movies in Train to sharpen these picks.
          </p>
          <Button size="sm" variant="secondary" onClick={onGoTrain}>
            Train
          </Button>
        </div>
      )}

      {/* Hero pick */}
      {top && (
        <article className="relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-3xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={top.movie.cover || '/placeholder.svg'}
            alt={`${top.movie.title} poster`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute left-4 top-4">
            <Badge className="bg-primary text-primary-foreground">
              Top match · {Math.round(top.score)}%
            </Badge>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h2 className="text-balance font-display text-2xl font-bold text-white">
              {top.movie.title}
            </h2>
            <p className="mt-0.5 text-sm text-white/70">
              {top.movie.year} · {top.movie.tagline}
            </p>
          </div>
        </article>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {ranked.slice(1).map(({ movie, score }) => (
          <li
            key={movie.id}
            className="flex gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.cover || '/placeholder.svg'}
                alt={`${movie.title} poster`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-display font-semibold">
                  {movie.title}
                </h3>
                <span className="shrink-0 font-mono text-sm tabular-nums text-primary">
                  {Math.round(score)}%
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {movie.year}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {movie.genres.slice(0, 2).map((g) => (
                  <Badge key={g} variant="secondary" className="text-[11px]">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
