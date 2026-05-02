import { pgTable, text, timestamp, varchar, primaryKey } from 'drizzle-orm/pg-core'
import { events, eventCandidates } from '../events/db'

// イベントごとの全体コメント
export const eventAnswers = pgTable('event_answers', {
  eventId: varchar('event_id', { length: 255 }).references(() => events.id).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  comment: text('comment'),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.eventId, t.userId] }),
}))

// イベントの各候補に対する回答（投票）
export const candidateAnswers = pgTable('candidate_answers', {
  candidateId: varchar('candidate_id', { length: 255 }).references(() => eventCandidates.id).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  status: text('status').$type<'attend' | 'absent'>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.candidateId, t.userId] }),
}))

// 【新規】ユーザーのマスター空き状況（投票とは独立して保持）
export const userGlobalAvailability = pgTable('user_global_availability', {
  userId: varchar('user_id', { length: 255 }).notNull(),
  date: timestamp('date', { mode: 'string' }).notNull(),
  status: text('status').$type<'attend' | 'absent'>().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.date] }),
}))
