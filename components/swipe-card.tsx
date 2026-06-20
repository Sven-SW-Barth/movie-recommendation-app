'use client'

import { useState } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'motion/react'
import { type Movie } from '@/lib/catalog'
import { Heart, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const SWIPE_THRESHOLD = 110

export function SwipeCard({
  movie,
  onSwipe,
  disabled,
}: {
  movie: Movie
  onSwipe: (liked: boolean) => void
  disabled?: boolean
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const likeOpacity = useTransform(x, [20, 130], [0, 1])
  const nopeOpacity = useTransform(x, [-20, -130], [0, 1])
  const [exitX, setExitX] = useState(0)

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (disabled) return
    if (info.offset.x > SWIPE_THRESHOLD) {
      setExitX(320)
      onSwipe(true)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      setExitX(-320)
      onSwipe(false)
    }
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, rotate }}
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX, opacity: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="relative h-full w-full overflow-hidden border border-foreground bg-card shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.cover || '/placeholder.svg'}
          alt={`${movie.title} poster`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/20" />

        {/* top editorial label */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3">
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-white/80">
            Now showing
          </span>
          <span className="font-display text-sm font-semibold tabular-nums text-white/80">
            ★ {movie.rating?.toFixed(1) ?? '—'}
          </span>
        </div>

        {/* LIKE stamp */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute left-5 top-12 rotate-[-12deg] border-2 border-like px-3 py-1"
        >
          <span className="font-display text-3xl font-bold uppercase italic tracking-wide text-like">
            Yes
          </span>
        </motion.div>

        {/* NOPE stamp */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute right-5 top-12 rotate-[12deg] border-2 border-dislike px-3 py-1"
        >
          <span className="font-display text-3xl font-bold uppercase italic tracking-wide text-dislike">
            Pass
          </span>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex flex-wrap gap-1.5">
            {movie.genres.slice(0, 3).map((g) => (
              <Badge
                key={g}
                variant="secondary"
                className="rounded-none border border-white/30 bg-transparent text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-white"
              >
                {g}
              </Badge>
            ))}
          </div>
          <h2 className="mt-3 text-balance font-display text-3xl font-bold leading-[0.95] text-white">
            {movie.title}
          </h2>
          <p className="mt-1.5 text-sm italic text-white/75">
            {movie.year} — {movie.tagline}
          </p>
        </div>
      </div>

      {/* gesture hints */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-3.5 flex items-center justify-between px-1">
        <span className="flex size-9 items-center justify-center border border-dislike bg-background text-dislike">
          <X className="size-5" aria-hidden="true" />
        </span>
        <span className="flex size-9 items-center justify-center border border-like bg-background text-like">
          <Heart className="size-5" aria-hidden="true" />
        </span>
      </div>
    </motion.div>
  )
}
