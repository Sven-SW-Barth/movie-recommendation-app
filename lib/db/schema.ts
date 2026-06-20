import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  jsonb,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------

// One row per user: tracks onboarding state and the currently active mood.
export const userSettings = pgTable('user_settings', {
  userId: text('userId').primaryKey(),
  activeMood: text('activeMood'),
  onboarded: boolean('onboarded').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// One row per user-created mood. Each mood is an independent, separately
// trainable preference profile generated from an LLM conversation.
//   - `mood`      stable per-user id (uuid) referenced by settings + swipes
//   - `name`      user-given label (e.g. "Sunday hangover")
//   - `icon`      icon name from the allowed set (see lib/catalog ICON_NAMES)
//   - `baseStats` the profile the LLM derived from the chat (reset target)
//   - `stats`     the current, swipe-trained profile (categoryId -> 0-100)
// Training only mutates the `stats` of the active mood.
export const moodProfiles = pgTable('mood_profiles', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  mood: text('mood').notNull(),
  name: text('name').notNull().default('My mood'),
  icon: text('icon').notNull().default('sparkles'),
  baseStats: jsonb('baseStats').notNull().$type<Record<string, number>>(),
  stats: jsonb('stats').notNull().$type<Record<string, number>>(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// History of every swipe a user made, scoped to the mood it was made under.
export const swipes = pgTable('swipes', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  movieId: text('movieId').notNull(),
  mood: text('mood').notNull(),
  liked: boolean('liked').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
