import catalogData from '@/data/catalog.json'

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
  tagline: string
  cover: string
  attributes: Record<string, number>
}

type Catalog = {
  categories: Category[]
  moods: Mood[]
  movies: Movie[]
}

const catalog = catalogData as Catalog

export const categories: Category[] = catalog.categories
export const moods: Mood[] = catalog.moods
export const movies: Movie[] = catalog.movies

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
    base[c.id] = mood?.preset[c.id] ?? 50
  }
  return base
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

// A movie is considered to "express" a category when its attribute is at or
// above this midpoint. Those are the categories a swipe acts on.
export const EXPRESS_THRESHOLD = 50

/**
 * Apply a swipe to a stats profile and return the updated profile.
 *
 * The twist: every category the movie EXPRESSES (attribute >= threshold) is
 * nudged by exactly STEP (0.5). A like pushes those categories up, a dislike
 * pushes them down. Categories the movie does not express are left untouched,
 * so swiping a "90% action" movie only moves the stats that movie is actually
 * about. Scores are clamped to the 0-100 range. Only the active mood's profile
 * is ever passed in here.
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
      const current = next[c.id] ?? 50
      next[c.id] = clamp(current + direction * STEP)
    }
  }
  return next
}

/**
 * Score how well a movie matches a stats profile (higher = better match).
 * Uses negative mean absolute difference so 0 = perfect match.
 */
export function matchScore(
  stats: Record<string, number>,
  movie: Movie,
): number {
  let total = 0
  for (const c of categories) {
    const s = stats[c.id] ?? 50
    const a = movie.attributes[c.id] ?? 50
    total += Math.abs(s - a)
  }
  const meanDiff = total / categories.length
  return 100 - meanDiff
}
