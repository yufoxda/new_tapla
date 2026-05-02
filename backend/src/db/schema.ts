import { pgTable, text, timestamp, varchar, integer, unique, uuid, boolean } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// 1. users: アプリケーションユーザー
export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  authUserId: varchar('auth_user_id', { length: 255 }).notNull().unique(), // Keycloak ID
  displayName: varchar('display_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})

// 2. events: 予定本体
export const events = pgTable('events', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})

// 3. event_dates: 候補日（列）
export const eventDates = pgTable('event_dates', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  dateLabel: varchar('date_label', { length: 255 }).notNull(), // 表示用ラベル
  columnOrder: integer('column_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  unique('event_dates_event_id_column_order_unique').on(t.eventId, t.columnOrder),
])

// 4. event_times: 候補時間（行）
export const eventTimes = pgTable('event_times', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  timeLabel: varchar('time_label', { length: 255 }).notNull(), // 表示用ラベル
  rowOrder: integer('row_order').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  unique('event_times_event_id_row_order_unique').on(t.eventId, t.rowOrder),
])

// 5. voteuser: 投票に参加するユーザー（参加者）
export const voteUsers = pgTable('voteuser', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('userid').references(() => users.id, { onDelete: 'cascade' }), // 登録ユーザーの場合
  userLabel: varchar('userlabel', { length: 255 }).notNull(), // 表示名
  voteId: uuid('voteid').references(() => events.id, { onDelete: 'cascade' }).notNull(), // どのイベントの参加者か
  comment: text('comment'), // イベント全体へのコメント
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  unique('voteuser_userlabel_voteid_unique').on(t.userLabel, t.voteId),// 同じイベント内で同じ表示名は不可
])

// 6. votes: 具体的な投票データ（各セル）
export const votes = pgTable('votes', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  voteUserId: uuid('voteuser_id').references(() => voteUsers.id, { onDelete: 'cascade' }).notNull(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  eventDateId: uuid('event_date_id').references(() => eventDates.id, { onDelete: 'cascade' }).notNull(),
  eventTimeId: uuid('event_time_id').references(() => eventTimes.id, { onDelete: 'cascade' }).notNull(),
  status: boolean('status').notNull().default(false),
  votedAt: timestamp('voted_at', { mode: 'string' }).defaultNow().notNull(),
}, (t) => [
  unique('votes_voteuser_id_event_date_id_event_time_id_unique').on(t.voteUserId, t.eventDateId, t.eventTimeId),
])

// 7. user_availability_patterns: 自動入力用のマスターパターン
export const userAvailabilityPatterns = pgTable('user_availability_patterns', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_time', { mode: 'string' }).notNull(),
  endTime: timestamp('end_time', { mode: 'string' }).notNull(),
}, (t) => [
  unique('user_availability_patterns_user_id_start_time_end_time_unique').on(t.userId, t.startTime, t.endTime),
])

