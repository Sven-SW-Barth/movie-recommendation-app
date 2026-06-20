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
      <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.cover || '/placeholder.svg'}
          alt={`${movie.title} poster`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        {/* LIKE overlay */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute left-5 top-6 rotate-[-12deg] rounded-lg border-2 border-like px-3 py-1"
        >
          <span className="font-display text-2xl font-extrabold uppercase tracking-wider text-like">
            Like
          </span>
        </motion.div>

        {/* NOPE overlay */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute right-5 top-6 rotate-[12deg] rounded-lg border-2 border-dislike px-3 py-1"
        >
          <span className="font-display text-2xl font-extrabold uppercase tracking-wider text-dislike">
            Nope
          </span>
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex flex-wrap gap-1.5">
            {movie.genres.slice(0, 3).map((g) => (
              <Badge
                key={g}
                variant="secondary"
                className="border-white/10 bg-white/10 text-white backdrop-blur"
              >
                {g}
              </Badge>
            ))}
          </div>
          <h2 className="mt-2 text-balance font-display text-2xl font-bold leading-tight text-white">
            {movie.title}
          </h2>
          <p className="mt-0.5 text-sm text-white/70">
            {movie.year} · {movie.tagline}
          </p>
        </div>
      </div>

      {/* gesture hints */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px flex items-center justify-between px-2">
        <span className="flex size-9 items-center justify-center rounded-full bg-dislike/20 text-dislike">
          <X className="size-5" aria-hidden="true" />
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-like/20 text-like">
          <Heart className="size-5" aria-hidden="true" />
        </span>
      </div>
    </motion.div>
  )
}
