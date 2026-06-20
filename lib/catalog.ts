import moviesData from '@/data/movies.json'

export type Category = {
  id: string
  label: string
  /** Plain-language description used to brief the mood-analysis LLM. */
  hint: string
}

/** A user-created mood: a named, separately-trainable taste profile. */
export type Mood = {
  moodId: string
  name: string
  icon: string
  stats: Record<string, number>
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
  { id: 'funny', label: 'Funny', hint: 'comedic, light, laugh-out-loud' },
  { id: 'cozy', label: 'Cozy', hint: 'warm, comforting, easy to sink into' },
  {
    id: 'feel_good',
    label: 'Feel-Good',
    hint: 'uplifting, hopeful, leaves you happy',
  },
  {
    id: 'date_night',
    label: 'Date Night',
    hint: 'romantic, crowd-pleasing, good to share with someone',
  },
  {
    id: 'weird_people',
    label: 'Weird People',
    hint: 'eccentric, offbeat, quirky characters and oddball humor',
  },
  {
    id: 'dark',
    label: 'Dark',
    hint: 'bleak, intense, heavy, emotionally serious or disturbing',
  },
  {
    id: 'mental_load',
    label: 'Mind Bender',
    hint: 'intellectual, dense, demanding, makes you think hard',
  },
  {
    id: 'rabbit_hole',
    label: 'Rabbit Hole',
    hint: 'layered, immersive worlds you fall deep into',
  },
  {
    id: 'hangover_friendly',
    label: 'Easy Watch',
    hint: 'low-effort, undemanding, foggy-brain friendly',
  },
]

export const categories: Category[] = CATEGORY_DEFS

/** The allowed mood icons (must exist in components/mood-icon.tsx). */
export const ICON_NAMES = [
  'sun',
  'laugh',
  'coffee',
  'heart',
  'skull',
  'brain',
  'telescope',
  'sparkles',
  'pizza',
  'moon',
  'cloud',
  'zap',
  'film',
  'flame',
  'leaf',
] as const

export type IconName = (typeof ICON_NAMES)[number]

/** A short brief of every category, fed to the mood-analysis model. */
export const CATEGORY_GUIDE = CATEGORY_DEFS.map(
  (c) => `- ${c.id} (${c.label}): ${c.hint}`,
).join('\n')

export const NEUTRAL_SCORE = 50

/** A neutral starting profile (every axis at 50). */
export function neutralStats(): Record<string, number> {
  const base: Record<string, number> = {}
  for (const c of categories) base[c.id] = NEUTRAL_SCORE
  return base
}

/** Coerce an arbitrary weights map into a clean, clamped 9-axis profile. */
export function normalizeStats(
  input: Partial<Record<string, number>>,
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of categories) {
    const raw = input[c.id]
    out[c.id] = typeof raw === 'number' ? clamp(raw) : NEUTRAL_SCORE
  }
  return out
}

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

export function getMovie(id: string): Movie | undefined {
  return movies.find((m) => m.id === id)
}

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

// How much a single like/dislike nudges a category score.
export const STEP = 0.5

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
      const current = next[c.id] ?? NEUTRAL_SCORE
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
    const s = stats[c.id] ?? NEUTRAL_SCORE
    const a = movie.attributes[c.id] ?? NEUTRAL_SCORE
    total += Math.abs(s - a)
  }
  const meanDiff = total / categories.length
  return 100 - meanDiff
}
