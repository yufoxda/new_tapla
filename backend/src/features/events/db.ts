import { pgTable, text, timestamp, varchar, json } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from '../users/db'

// 予定（イベント）本体
export const events = pgTable('events', {
  id: varchar('id', { length: 255 })
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  creatorId: varchar('creator_id', { length: 255 }).references(() => users.id).notNull(),
  candidates_date: json('candidates_date').$type<string[]>().notNull().default(sql`'[]'::json`),
  candidates_time: json('candidates_time').$type<string[]>().notNull().default(sql`'[]'::json`),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})
