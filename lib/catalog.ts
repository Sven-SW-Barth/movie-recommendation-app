import moviesData from '@/data/movies.json'

export type Category = {
  id: string
  label: string
}

export type Mood = {
  id: string
  label: string
  emoji: string
  description: string
  preset: Record<string, number>
}

export type Movie = {
  id: string
  title: string
  year: number
  rating: number
  genres: string[]
  tagline: string
  cover: string
  attributes: Record<string, number>
}

/**
 * The shared classification. These nine dimensions come straight from the
 * movie dataset's `mood_scores` and are used for BOTH the movie attributes and
 * the user's per-mood taste profile, so likes/dislikes move the profile along
 * the exact same axes the movies are scored on.
 */
const CATEGORY_DEFS: Category[] = [
  { id: 'funny', label: 'Funny' },
  { id: 'cozy', label: 'Cozy' },
  { id: 'feel_good', label: 'Feel-Good' },
  { id: 'date_night', label: 'Date Night' },
  { id: 'weird_people', label: 'Weird People' },
  { id: 'dark', label: 'Dark' },
  { id: 'mental_load', label: 'Mental Load' },
  { id: 'rabbit_hole', label: 'Rabbit Hole' },
  { id: 'hangover_friendly', label: 'Hangover-Friendly' },
]

export const categories: Category[] = CATEGORY_DEFS

/**
 * Each mood is an independent, separately-trainable profile. A mood maps to one
 * of the shared categories and starts biased toward it (that category high, the
 * rest neutral); swiping then refines the whole nine-axis vector for that mood
 * only.
 */
const MOOD_DEFS: Omit<Mood, 'preset'>[] = [
  {
    id: 'feel_good',
    label: 'Feel-Good',
    emoji: 'sun',
    description: 'Uplifting, warm-hearted watches.',
  },
  {
    id: 'funny',
    label: 'Funny',
    emoji: 'laugh',
    description: 'Laugh-out-loud, easy fun.',
  },
  {
    id: 'cozy',
    label: 'Cozy',
    emoji: 'coffee',
    description: 'Comforting and easy to sink into.',
  },
  {
    id: 'date_night',
    label: 'Date Night',
    emoji: 'heart',
    description: 'Crowd-pleasers to share.',
  },
  {
    id: 'dark',
    label: 'Dark',
    emoji: 'skull',
    description: 'Bleak, intense, no easy comfort.',
  },
  {
    id: 'mental_load',
    label: 'Mind Bender',
    emoji: 'brain',
    description: 'Dense and demanding.',
  },
  {
    id: 'rabbit_hole',
    label: 'Rabbit Hole',
    emoji: 'telescope',
    description: 'Layered worlds to fall into.',
  },
  {
    id: 'weird_people',
    label: 'Oddballs',
    emoji: 'sparkles',
    description: 'Eccentric, offbeat characters.',
  },
  {
    id: 'hangover_friendly',
    label: 'Hangover',
    emoji: 'pizza',
    description: 'Low-effort, foggy-brain friendly.',
  },
]

const PRESET_HIGH = 80
const PRESET_BASE = 50

export const moods: Mood[] = MOOD_DEFS.map((m) => {
  const preset: Record<string, number> = {}
  for (const c of categories) {
    preset[c.id] = c.id === m.id ? PRESET_HIGH : PRESET_BASE
  }
  return { ...m, preset }
})

type RawMovie = {
  id: string
  title: string
  year: number
  rating?: number
  genres?: string[]
  poster_url?: string
  mood_scores?: Record<string, number>
}

// mood_scores are 0-10 in the dataset; the profiles work on a 0-100 scale.
const SCORE_SCALE = 10

export const movies: Movie[] = (moviesData as RawMovie[]).map((r) => {
  const attributes: Record<string, number> = {}
  for (const c of categories) {
    const raw = r.mood_scores?.[c.id] ?? 0
    attributes[c.id] = clamp(raw * SCORE_SCALE)
  }
  const rating = r.rating ?? 0
  return {
    id: r.id,
    title: r.title,
    year: r.year,
    rating,
    genres: r.genres ?? [],
    tagline: rating ? `★ ${rating.toFixed(1)}` : (r.genres?.[0] ?? ''),
    cover: r.poster_url ?? '/placeholder.svg',
    attributes,
  }
})

export function getMood(id: string | null | undefined): Mood | undefined {
  if (!id) return undefined
  return moods.find((m) => m.id === id)
}

export function getMovie(id: string): Movie | undefined {
  return movies.find((m) => m.id === id)
}

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

// How much a single like/dislike nudges a category score.
export const STEP = 0.5

// Default starting stats for a mood = its preset (cloned).
export function presetFor(moodId: string): Record<string, number> {
  const mood = getMood(moodId)
  const base: Record<string, number> = {}
  for (const c of categories) {
    base[c.id] = mood?.preset[c.id] ?? PRESET_BASE
  }
  return base
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

// A movie "expresses" a category when its attribute is at or above this
// midpoint (i.e. a mood_score of 5/10 or higher). Those are the categories a
// swipe acts on.
export const EXPRESS_THRESHOLD = 50

/**
 * Apply a swipe to a stats profile and return the updated profile.
 *
 * The twist: every category the movie EXPRESSES (attribute >= threshold) is
 * nudged by exactly STEP (0.5). A like pushes those categories up, a dislike
 * pushes them down. Categories the movie does not express are left untouched,
 * so swiping a loud, funny movie only moves the stats that movie is actually
 * about. Scores are clamped to 0-100. Only the active mood's profile is ever
 * passed in here.
 */
export function applySwipe(
  stats: Record<string, number>,
  movie: Movie,
  liked: boolean,
): Record<string, number> {
  const next: Record<string, number> = { ...stats }
  const direction = liked ? 1 : -1
  for (const c of categories) {
    const attr = movie.attributes[c.id] ?? 0
    if (attr >= EXPRESS_THRESHOLD) {
      const current = next[c.id] ?? PRESET_BASE
      next[c.id] = clamp(current + direction * STEP)
    }
  }
  return next
}

/**
 * Score how well a movie matches a stats profile (higher = better match).
 * Uses mean absolute difference so 100 = perfect match.
 */
export function matchScore(
  stats: Record<string, number>,
  movie: Movie,
): number {
  let total = 0
  for (const c of categories) {
    const s = stats[c.id] ?? PRESET_BASE
    const a = movie.attributes[c.id] ?? PRESET_BASE
    total += Math.abs(s - a)
  }
  const meanDiff = total / categories.length
  return 100 - meanDiff
}
