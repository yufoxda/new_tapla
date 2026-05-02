import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, inArray, and, desc, sql, getTableColumns } from 'drizzle-orm'
import type { AppContext } from '../../core/types'
import { AnswerSchema, UpsertAnswerSchema, AutoFillStatusSchema } from './schema'
import { eventAnswers, candidateAnswers, userGlobalAvailability } from './db'
import { users } from '../users/db'
import { requireAuth } from '../../core/auth'

export const answersRouter = new OpenAPIHono<AppContext>()

// マスター空き時間を取得
const getGlobalAvailabilityRoute = createRoute({
  method: 'get',
  path: '/global-availability',
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AutoFillStatusSchema) } },
      description: 'ユーザーのマスター空き時間設定',
    },
  },
})

// マスター空き時間を更新
const updateGlobalAvailabilityRoute = createRoute({
  method: 'put',
  path: '/global-availability',
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: { 'application/json': { schema: z.array(AutoFillStatusSchema) } },
      required: true,
    },
  },
  responses: {
    200: { description: '更新成功' },
  },
})

// 自動入力用（マスターテーブルを参照）
const getAutoFillRoute = createRoute({
  method: 'get',
  path: '/autofill',
  middleware: [requireAuth] as const,
  request: {
    query: z.object({
      dates: z.string().openapi({ example: '2026-05-01T18:00:00Z', description: 'カンマ区切りの日時' }),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AutoFillStatusSchema) } },
      description: 'マスター設定に基づくステータス',
    },
  },
})

// --- API実装 ---

answersRouter.openapi(getGlobalAvailabilityRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const results = await db.select().from(userGlobalAvailability).where(eq(userGlobalAvailability.userId, user.id))
  return c.json(results.map(r => ({ date: r.date, status: r.status })))
})

answersRouter.openapi(updateGlobalAvailabilityRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const body = c.req.valid('json')
  const now = new Date().toISOString()

  for (const item of body) {
    await db.insert(userGlobalAvailability).values({
      userId: user.id,
      date: item.date,
      status: item.status,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: [userGlobalAvailability.userId, userGlobalAvailability.date],
      set: { status: item.status, updatedAt: now }
    })
  }
  return c.json({ success: true })
})

answersRouter.openapi(getAutoFillRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const { dates } = c.req.valid('query')
  const dateList = dates.split(',').filter(d => d.length > 0)
  if (dateList.length === 0) return c.json([])

  const results = await db.select().from(userGlobalAvailability).where(
    and(
      eq(userGlobalAvailability.userId, user.id),
      inArray(userGlobalAvailability.date, dateList)
    )
  )
  return c.json(results.map(r => ({ date: r.date, status: r.status })))
})

// 既存のイベント回答取得
answersRouter.openapi(createRoute({
    method: 'get',
    path: '/{eventId}',
    responses: { 200: { content: { 'application/json': { schema: z.array(AnswerSchema) } }, description: 'OK' } }
}), async (c) => {
  const db = c.get('db')
  const { eventId } = c.req.param()
  
  const eventAns = await db.select({
    ...getTableColumns(eventAnswers),
    userDisplayName: users.displayName
  }).from(eventAnswers)
    .innerJoin(users, eq(eventAnswers.userId, users.id))
    .where(eq(eventAnswers.eventId, eventId))
    
  const candAnswers = await db.select().from(candidateAnswers).where(eq(candidateAnswers.eventId, eventId))

  return c.json(eventAns.map(ea => ({
    ...ea,
    candidateAnswers: candAnswers.filter(ca => ca.userId === ea.userId).map(ca => ({
      candidateId: ca.candidateId,
      status: ca.status
    }))
  })))
})

// 既存のイベント回答更新
answersRouter.openapi(createRoute({
    method: 'put',
    path: '/{eventId}',
    middleware: [requireAuth] as const,
    request: { body: { content: { 'application/json': { schema: UpsertAnswerSchema } }, required: true } },
    responses: { 200: { content: { 'application/json': { schema: AnswerSchema } }, description: 'OK' } }
}), async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const { eventId } = c.req.param()
  const body = c.req.valid('json')
  const now = new Date().toISOString()

  const [upserted] = await db.insert(eventAnswers).values({
    eventId, userId: user.id, comment: body.comment || null, updatedAt: now
  }).onConflictDoUpdate({
    target: [eventAnswers.eventId, eventAnswers.userId],
    set: { comment: body.comment || null, updatedAt: now }
  }).returning()

  const candidateData = body.candidateAnswers.map(ca => ({
    eventId, candidateId: ca.candidateId, userId: user.id, status: ca.status, updatedAt: now
  }))

  if (candidateData.length > 0) {
    await db.insert(candidateAnswers).values(candidateData).onConflictDoUpdate({
      target: [candidateAnswers.candidateId, candidateAnswers.userId],
      set: { status: sql`excluded.status`, updatedAt: now }
    })
  }

  return c.json({
    ...upserted,
    userDisplayName: user.displayName,
    candidateAnswers: candidateData.map(ca => ({ candidateId: ca.candidateId, status: ca.status }))
  })
})
