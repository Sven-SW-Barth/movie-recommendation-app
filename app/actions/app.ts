'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { moodProfiles, swipes, userSettings } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  applySwipe,
  getMovie,
  ICON_NAMES,
  normalizeStats,
  type IconName,
} from '@/lib/catalog'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export type Mood = {
  moodId: string
  name: string
  icon: string
  stats: Record<string, number>
  swipeCount: number
}

export type UserState = {
  onboarded: boolean
  activeMood: string | null
  activeName: string | null
  activeIcon: string | null
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

  const row = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)
  return row[0]
}

/** Look up one of the user's mood profiles by its id. */
async function findProfile(userId: string, moodId: string) {
  const rows = await db
    .select()
    .from(moodProfiles)
    .where(and(eq(moodProfiles.userId, userId), eq(moodProfiles.mood, moodId)))
    .limit(1)
  return rows[0]
}

/** Full state needed to render the app for the current user. */
export async function getUserState(): Promise<UserState> {
  const userId = await getUserId()
  const settings = await ensureSettings(userId)

  const empty: UserState = {
    onboarded: settings.onboarded,
    activeMood: settings.activeMood,
    activeName: null,
    activeIcon: null,
    stats: {},
    swipedMovieIds: [],
    swipeCount: 0,
  }

  if (!settings.onboarded || !settings.activeMood) return empty

  const profile = await findProfile(userId, settings.activeMood)
  if (!profile) return empty

  const moodSwipes = await db
    .select()
    .from(swipes)
    .where(and(eq(swipes.userId, userId), eq(swipes.mood, profile.mood)))
    .orderBy(desc(swipes.createdAt))

  return {
    onboarded: settings.onboarded,
    activeMood: profile.mood,
    activeName: profile.name,
    activeIcon: profile.icon,
    stats: profile.stats,
    swipedMovieIds: moodSwipes.map((s) => s.movieId),
    swipeCount: moodSwipes.length,
  }
}

export type CreateMoodInput = {
  name: string
  icon: string
  weights: Record<string, number>
}

/**
 * Create a new user mood from an analyzed chat. Generates a stable mood id,
 * stores the LLM-derived weights as both the reset baseline and the live
 * (trainable) stats, makes it the active mood, and marks the user onboarded.
 */
export async function createMood(input: CreateMoodInput): Promise<string> {
  const userId = await getUserId()
  await ensureSettings(userId)

  const name = input.name.trim().slice(0, 40) || 'My mood'
  const icon = (ICON_NAMES as readonly string[]).includes(input.icon)
    ? (input.icon as IconName)
    : 'sparkles'
  const stats = normalizeStats(input.weights)
  const moodId = crypto.randomUUID()

  await db.insert(moodProfiles).values({
    userId,
    mood: moodId,
    name,
    icon,
    baseStats: stats,
    stats,
  })

  await db
    .update(userSettings)
    .set({ activeMood: moodId, onboarded: true, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))

  revalidatePath('/')
  return moodId
}

/** Switch the active mood. Validates the mood belongs to this user. */
export async function setActiveMood(moodId: string): Promise<void> {
  const userId = await getUserId()
  const profile = await findProfile(userId, moodId)
  if (!profile) throw new Error('Unknown mood')

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

  const profile = await findProfile(userId, settings.activeMood)
  if (!profile) throw new Error('No active mood profile')

  const nextStats = applySwipe(profile.stats, movie, liked)

  await db
    .update(moodProfiles)
    .set({ stats: nextStats, updatedAt: new Date() })
    .where(eq(moodProfiles.id, profile.id))

  await db
    .insert(swipes)
    .values({ userId, movieId, mood: profile.mood, liked })

  revalidatePath('/')
  return { stats: nextStats, mood: profile.mood }
}

/** Reset (delete swipes + restore the analyzed baseline) for the active mood. */
export async function resetActiveMood(): Promise<void> {
  const userId = await getUserId()
  const settings = await ensureSettings(userId)
  if (!settings.activeMood) return

  const profile = await findProfile(userId, settings.activeMood)
  if (!profile) return

  await db
    .delete(swipes)
    .where(and(eq(swipes.userId, userId), eq(swipes.mood, profile.mood)))

  await db
    .update(moodProfiles)
    .set({ stats: profile.baseStats, updatedAt: new Date() })
    .where(eq(moodProfiles.id, profile.id))

  revalidatePath('/')
}

/** Delete a mood and its swipes. Reassigns the active mood if needed. */
export async function deleteMood(moodId: string): Promise<void> {
  const userId = await getUserId()
  const profile = await findProfile(userId, moodId)
  if (!profile) return

  await db
    .delete(swipes)
    .where(and(eq(swipes.userId, userId), eq(swipes.mood, moodId)))
  await db.delete(moodProfiles).where(eq(moodProfiles.id, profile.id))

  const settings = await ensureSettings(userId)
  if (settings.activeMood === moodId) {
    const remaining = await db
      .select()
      .from(moodProfiles)
      .where(eq(moodProfiles.userId, userId))
      .orderBy(desc(moodProfiles.createdAt))
      .limit(1)
    await db
      .update(userSettings)
      .set({
        activeMood: remaining[0]?.mood ?? null,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
  }

  revalidatePath('/')
}

/** All of the user's moods, with per-mood swipe counts. */
export async function getUserMoods(): Promise<Mood[]> {
  const userId = await getUserId()

  const profiles = await db
    .select()
    .from(moodProfiles)
    .where(eq(moodProfiles.userId, userId))
    .orderBy(moodProfiles.createdAt)
  const allSwipes = await db
    .select()
    .from(swipes)
    .where(eq(swipes.userId, userId))

  return profiles.map((p) => ({
    moodId: p.mood,
    name: p.name,
    icon: p.icon,
    stats: p.stats,
    swipeCount: allSwipes.filter((s) => s.mood === p.mood).length,
  }))
}
