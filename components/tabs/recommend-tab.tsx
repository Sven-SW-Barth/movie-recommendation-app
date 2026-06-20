'use client'

import { useMemo } from 'react'
import { movies, matchScore } from '@/lib/catalog'
import { MoodIcon } from '@/components/mood-icon'
import { Badge } from '@/components/ui/badge'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RecommendTab({
  moodName,
  moodIcon,
  stats,
  swipeCount,
  onGoTrain,
}: {
  moodName: string
  moodIcon: string
  stats: Record<string, number>
  swipeCount: number
  onGoTrain: () => void
}) {
  const ranked = useMemo(() => {
    return [...movies]
      .map((m) => ({ movie: m, score: matchScore(stats, m) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
  }, [stats])

  const top = ranked[0]

  return (
    <div className="flex flex-col px-5 pb-4">
      <header className="border-b border-border pb-3 pt-6">
        <div className="flex items-center justify-between">
          <span className="flex max-w-[60%] items-center gap-1.5 eyebrow">
            <MoodIcon name={moodIcon} className="size-3.5 shrink-0" />
            <span className="truncate">{moodName}</span>
          </span>
          <span className="eyebrow">The Selects</span>
        </div>
        <h1 className="mt-2 font-display text-4xl font-bold leading-none">
          For <span className="italic font-medium">You</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ranked by how closely each film matches your{' '}
          <span className="italic">{moodName}</span> profile.
        </p>
      </header>

      {swipeCount < 3 && (
        <div className="mt-5 flex items-center gap-3 border border-foreground bg-primary p-4 text-primary-foreground">
          <Layers className="size-5 shrink-0" aria-hidden="true" />
          <p className="flex-1 text-sm">
            Review a few films in the Screening Room to sharpen these picks.
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-none uppercase tracking-[0.12em]"
            onClick={onGoTrain}
          >
            Train
          </Button>
        </div>
      )}

      {/* Hero pick */}
      {top && (
        <article className="relative mt-6 aspect-[4/5] w-full overflow-hidden border border-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={top.movie.cover || '/placeholder.svg'}
            alt={`${top.movie.title} poster`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-white/85">
              Top match
            </span>
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-white/85">
              No. 01
            </span>
          </div>

          {/* big overlapping match numeral */}
          <div className="pointer-events-none absolute -bottom-4 right-2 text-right leading-[0.8]">
            <span className="index-numeral block text-[7rem] text-white/95">
              {Math.round(top.score)}
            </span>
            <span className="mr-3 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-white/85">
              Percent match
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex flex-wrap gap-1.5">
              {top.movie.genres.slice(0, 3).map((g) => (
                <Badge
                  key={g}
                  variant="secondary"
                  className="rounded-none border border-white/30 bg-transparent text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-white"
                >
                  {g}
                </Badge>
              ))}
            </div>
            <h2 className="mt-3 max-w-[70%] text-balance font-display text-3xl font-bold leading-[0.95] text-white">
              {top.movie.title}
            </h2>
            <p className="mt-1.5 max-w-[70%] text-sm italic text-white/75">
              {top.movie.year} — {top.movie.tagline}
            </p>
          </div>
        </article>
      )}

      <div className="mt-7 flex items-center justify-between border-b border-border pb-2">
        <span className="eyebrow">Also screening</span>
        <span className="eyebrow">{ranked.length - 1} films</span>
      </div>

      <ul className="mt-1 divide-y divide-border">
        {ranked.slice(1).map(({ movie, score }, i) => (
          <li key={movie.id} className="flex items-center gap-4 py-4">
            <span className="index-numeral w-8 shrink-0 text-2xl text-muted-foreground">
              {String(i + 2).padStart(2, '0')}
            </span>
            <div className="relative h-20 w-14 shrink-0 overflow-hidden border border-foreground">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.cover || '/placeholder.svg'}
                alt={`${movie.title} poster`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h3 className="truncate font-display text-lg font-bold leading-tight">
                {movie.title}
              </h3>
              <p className="text-xs italic text-muted-foreground">
                {movie.year} · {movie.genres.slice(0, 2).join(' / ')}
              </p>
            </div>
            <span className="index-numeral shrink-0 text-xl tabular-nums">
              {Math.round(score)}
              <span className="text-xs text-muted-foreground">%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
