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

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

// --- Gradient matching algorithm hyperparameters ---------------------------
// The active mood is a vector the algorithm nudges toward (Like) or away from
// (Pass) the movie, but only for traits the movie expresses strongly enough to
// be informative. Neutral traits are ignored to prevent profile dilution.
export const LIKE_LEARNING_RATE = 0.06 // how fast the profile adapts to a Like
export const PASS_LEARNING_RATE = 0.03 // how fast the profile adapts to a Pass
export const HIGH_THRESHOLD = 70.0 // value at/above which a trait is dominant
export const LOW_THRESHOLD = 20.0 // value at/below which a trait is lacking

/**
 * Apply a swipe to a mood profile and return the updated profile.
 *
 * For every attribute we take `difference = movie_value - user_value` and:
 *
 *   LIKE  — only dominant movie traits (>= HIGH_THRESHOLD) pull the profile
 *           toward the movie: user += LIKE_LEARNING_RATE * difference.
 *
 *   PASS  — dominant traits (>= HIGH_THRESHOLD, "too intense") AND lacking
 *           traits (<= LOW_THRESHOLD, "missing something") push the profile
 *           away: user -= PASS_LEARNING_RATE * difference. Because `difference`
 *           is negative for lacking traits, subtracting raises the user value.
 *
 * Neutral traits (strictly between the thresholds) are ignored for both
 * actions. Every updated value is clamped to [0, 100]. Only the active mood's
 * profile is ever passed in here.
 */
export function applySwipe(
  stats: Record<string, number>,
  movie: Movie,
  liked: boolean,
): Record<string, number> {
  const next: Record<string, number> = { ...stats }
  for (const c of categories) {
    const userValue = next[c.id] ?? NEUTRAL_SCORE
    const movieValue = movie.attributes[c.id] ?? 0
    const difference = movieValue - userValue

    if (liked) {
      // SCENARIO A: only adapt toward dominant traits.
      if (movieValue >= HIGH_THRESHOLD) {
        next[c.id] = clamp(userValue + LIKE_LEARNING_RATE * difference)
      }
    } else {
      // SCENARIO B: move away from too-intense or too-lacking traits.
      if (movieValue >= HIGH_THRESHOLD || movieValue <= LOW_THRESHOLD) {
        next[c.id] = clamp(userValue - PASS_LEARNING_RATE * difference)
      }
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

// --- Training queue (exploit / explore) ------------------------------------
// The Train feed balances showing what the user already likes (exploitation)
// against films that probe their boundaries and resolve uncertainty
// (exploration). Each movie earns a TrainingScore in [0,1] from three parts.
export const TRAIN_MATCH_WEIGHT = 0.6
export const TRAIN_POLARITY_WEIGHT = 0.2
export const TRAIN_UNCERTAINTY_WEIGHT = 0.2

// Boundaries used by the polarity component.
const POLARITY_USER_LOW = 30.0
const POLARITY_MOVIE_HIGH = 70.0

// Only the strongest scorers get shuffled, and only a little.
const TRAIN_SHUFFLE_TOP = 30
const TRAIN_NOISE = 0.02

// Largest possible Euclidean distance across the attribute space (each axis 0-100).
const MAX_DISTANCE = Math.sqrt(categories.length) * 100

type ScoredMovie = { movie: Movie; score: number }

/** Raw (un-normalized) scores for one movie against the active mood. */
function rawTrainingScores(
  userMood: Record<string, number>,
  movie: Movie,
): { match: number; polarity: number; uncertainty: number } {
  let sumSquares = 0
  let polarity = 0
  let uncertainty = 0

  for (const c of categories) {
    const user = userMood[c.id] ?? NEUTRAL_SCORE
    const value = movie.attributes[c.id] ?? NEUTRAL_SCORE

    // A: match — Euclidean distance (accumulate squared differences).
    const diff = user - value
    sumSquares += diff * diff

    // B: polarity — user cold on a trait the movie leans hard into.
    if (user < POLARITY_USER_LOW && value > POLARITY_MOVIE_HIGH) {
      polarity += Math.abs(value - user)
    }

    // C: uncertainty — neutral user (near 50) × extreme movie trait (far from 50).
    const neutrality = 50.0 - Math.abs(user - 50.0)
    const extremity = Math.abs(value - 50.0)
    uncertainty += neutrality * extremity
  }

  const distance = Math.sqrt(sumSquares)
  const match = 1 - distance / MAX_DISTANCE // 1 = perfect match, 0 = farthest

  return { match, polarity, uncertainty }
}

/**
 * Build an optimized Train queue for the active mood.
 *
 * TrainingScore = 0.60*Match + 0.20*Polarity + 0.20*Uncertainty, where the
 * polarity and uncertainty totals are normalized against the strongest
 * candidate so each spans [0,1]. The list is sorted descending, then the top
 * 30 get a touch of random noise and a re-sort so the feed never feels rigid.
 */
export function buildTrainingQueue(
  userMood: Record<string, number>,
  movieList: Movie[] = movies,
): Movie[] {
  if (movieList.length === 0) return []

  const raw = movieList.map((movie) => ({
    movie,
    ...rawTrainingScores(userMood, movie),
  }))

  // Normalize polarity + uncertainty relative to the best candidate so both
  // exploration components use the full 0-1 range (match is already 0-1).
  const maxPolarity = Math.max(...raw.map((r) => r.polarity), 1e-9)
  const maxUncertainty = Math.max(...raw.map((r) => r.uncertainty), 1e-9)

  const scored: ScoredMovie[] = raw.map((r) => ({
    movie: r.movie,
    score:
      TRAIN_MATCH_WEIGHT * r.match +
      TRAIN_POLARITY_WEIGHT * (r.polarity / maxPolarity) +
      TRAIN_UNCERTAINTY_WEIGHT * (r.uncertainty / maxUncertainty),
  }))

  scored.sort((a, b) => b.score - a.score)

  // Inject a little noise into the top slice and re-sort just that slice, so
  // the strongest picks stay on top but their exact order stays fresh.
  const head = scored.slice(0, TRAIN_SHUFFLE_TOP)
  const tail = scored.slice(TRAIN_SHUFFLE_TOP)
  head.sort(
    (a, b) =>
      b.score +
      (Math.random() - 0.5) * TRAIN_NOISE -
      (a.score + (Math.random() - 0.5) * TRAIN_NOISE),
  )

  return [...head, ...tail].map((s) => s.movie)
}
