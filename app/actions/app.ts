'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { moodProfiles, swipes, userSettings } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  applySwipe,
  getMood,
  getMovie,
  moods,
  presetFor,
} from '@/lib/catalog'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export type UserState = {
  onboarded: boolean
  activeMood: string | null
  stats: Record<string, number>
  swipedMovieIds: string[]
  swipeCount: number
}

/** Ensure a settings row exists, returning it. Safe under concurrent calls. */
async function ensureSettings(userId: string) {
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)
  if (existing.length > 0) return existing[0]

  const inserted = await db
    .insert(userSettings)
    .values({ userId, onboarded: false })
    .onConflictDoNothing()
    .returning()
  if (inserted.length > 0) return inserted[0]

  // Another concurrent request created it first — read it back.
  const row = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)
  return row[0]
}

/** Get or create the profile (stats) for a given mood. */
async function ensureProfile(userId: string, mood: string) {
  const existing = await db
    .select()
    .from(moodProfiles)
    .where(and(eq(moodProfiles.userId, userId), eq(moodProfiles.mood, mood)))
    .limit(1)
  if (existing.length > 0) return existing[0]

  const inserted = await db
    .insert(moodProfiles)
    .values({ userId, mood, stats: presetFor(mood) })
    .onConflictDoNothing({
      target: [moodProfiles.userId, moodProfiles.mood],
    })
    .returning()
  if (inserted.length > 0) return inserted[0]

  // Lost the race — another request created it first.
  const row = await db
    .select()
    .from(moodProfiles)
    .where(and(eq(moodProfiles.userId, userId), eq(moodProfiles.mood, mood)))
    .limit(1)
  return row[0]
}

/** Full state needed to render the app for the current user. */
export async function getUserState(): Promise<UserState> {
  const userId = await getUserId()
  const settings = await ensureSettings(userId)

  if (!settings.onboarded || !settings.activeMood) {
    return {
      onboarded: settings.onboarded,
      activeMood: settings.activeMood,
      stats: {},
      swipedMovieIds: [],
      swipeCount: 0,
    }
  }

  const profile = await ensureProfile(userId, settings.activeMood)

  const moodSwipes = await db
    .select()
    .from(swipes)
    .where(
      and(eq(swipes.userId, userId), eq(swipes.mood, settings.activeMood)),
    )
    .orderBy(desc(swipes.createdAt))

  return {
    onboarded: settings.onboarded,
    activeMood: settings.activeMood,
    stats: profile.stats,
    swipedMovieIds: moodSwipes.map((s) => s.movieId),
    swipeCount: moodSwipes.length,
  }
}

/** Complete onboarding by choosing the first active mood. */
export async function completeOnboarding(moodId: string): Promise<void> {
  const userId = await getUserId()
  if (!getMood(moodId)) throw new Error('Unknown mood')

  await ensureSettings(userId)
  await ensureProfile(userId, moodId)
  await db
    .update(userSettings)
    .set({ activeMood: moodId, onboarded: true, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))

  revalidatePath('/')
}

/** Switch the active mood (creating its profile if needed). */
export async function setActiveMood(moodId: string): Promise<void> {
  const userId = await getUserId()
  if (!getMood(moodId)) throw new Error('Unknown mood')

  await ensureSettings(userId)
  await ensureProfile(userId, moodId)
  await db
    .update(userSettings)
    .set({ activeMood: moodId, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))

  revalidatePath('/')
}

export type SwipeResult = {
  stats: Record<string, number>
  mood: string
}

/**
 * Record a swipe for the active mood and update ONLY that mood's profile.
 * Returns the updated stats so the UI can animate the change.
 */
export async function recordSwipe(
  movieId: string,
  liked: boolean,
): Promise<SwipeResult> {
  const userId = await getUserId()
  const movie = getMovie(movieId)
  if (!movie) throw new Error('Unknown movie')

  const settings = await ensureSettings(userId)
  if (!settings.activeMood) throw new Error('No active mood')
  const mood = settings.activeMood

  const profile = await ensureProfile(userId, mood)
  const nextStats = applySwipe(profile.stats, movie, liked)

  await db
    .update(moodProfiles)
    .set({ stats: nextStats, updatedAt: new Date() })
    .where(eq(moodProfiles.id, profile.id))

  await db.insert(swipes).values({ userId, movieId, mood, liked })

  revalidatePath('/')
  return { stats: nextStats, mood }
}

/** Reset (delete swipes + reset stats to preset) for the active mood. */
export async function resetActiveMood(): Promise<void> {
  const userId = await getUserId()
  const settings = await ensureSettings(userId)
  if (!settings.activeMood) return
  const mood = settings.activeMood

  await db
    .delete(swipes)
    .where(and(eq(swipes.userId, userId), eq(swipes.mood, mood)))

  const profile = await ensureProfile(userId, mood)
  await db
    .update(moodProfiles)
    .set({ stats: presetFor(mood), updatedAt: new Date() })
    .where(eq(moodProfiles.id, profile.id))

  revalidatePath('/')
}

export type MoodSummary = {
  id: string
  trained: boolean
  swipeCount: number
}

/** Per-mood training summary, used by the Moods tab. */
export async function getMoodSummaries(): Promise<MoodSummary[]> {
  const userId = await getUserId()

  const profiles = await db
    .select()
    .from(moodProfiles)
    .where(eq(moodProfiles.userId, userId))
  const allSwipes = await db
    .select()
    .from(swipes)
    .where(eq(swipes.userId, userId))

  return moods.map((m) => {
    const count = allSwipes.filter((s) => s.mood === m.id).length
    return {
      id: m.id,
      trained: profiles.some((p) => p.mood === m.id),
      swipeCount: count,
    }
  })
}
