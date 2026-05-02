import { pgTable, text, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core'
import { events } from '../events/db'
import { users } from '../users/db'

// イベントごとの全体コメント
export const eventAnswers = pgTable('event_answers', {
  eventId: varchar('event_id', { length: 255 }).references(() => events.id).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  comment: text('comment'),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ name: 'event_answers_pk', columns: [t.eventId, t.userId] }),
])

// イベントの各候補に対する回答（投票）
// Note: candidateId should match what you generate or store in JSON for candidates, so it cannot be a real FK anymore.
export const candidateAnswers = pgTable('candidate_answers', {
  eventId: varchar('event_id', { length: 255 }).references(() => events.id).notNull(),
  candidateId: varchar('candidate_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  status: text('status').$type<'attend' | 'absent' | 'pending'>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ name: 'candidate_answers_pk', columns: [t.candidateId, t.userId] }),
])

// 【新規】ユーザーのマスター空き状況（投票とは独立して保持）
export const userGlobalAvailability = pgTable('user_global_availability', {
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  date: timestamp('date', { mode: 'string' }).notNull(),
  status: text('status').$type<'attend' | 'absent' | 'pending'>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ name: 'user_global_availability_pk', columns: [t.userId, t.date] }),
])
