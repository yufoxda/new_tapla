import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, inArray, and, desc, sql, getTableColumns } from 'drizzle-orm'
import type { AppContext } from '../../../core/types'
import { AnswerSchema, UpsertAnswerSchema } from './schema'
import { eventAnswers, candidateAnswers, users } from '../../../db/schema'
import { requireAuth } from '../../../core/auth'

export const answersRouter = new OpenAPIHono<AppContext>()

// read
//update に統合

// read
// 予定に対する全回答を取得
const getEventAnswersRoute = createRoute({
  method: 'get',
  path: '/{eventId}/answers',
  request: { params: z.object({ eventId: z.string() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AnswerSchema) } },
      description: '予定に対する全回答',
    },
    404: { description: 'Not found' }
  },
})

// update
// 投票を更新・修正 (Upsert)
const upsertEventAnswerRoute = createRoute({
    method: 'put',
    path: '/{eventId}/answers',
    middleware: [requireAuth] as const,
    request: {
      params: z.object({ eventId: z.string() }),
      body: { content: { 'application/json': { schema: UpsertAnswerSchema } }, required: true }
    },
    responses: {
      200: { content: { 'application/json': { schema: AnswerSchema } }, description: 'OK' }
    }
})

// delete
//updateに統合

// --- API実装 ---

answersRouter.openapi(getEventAnswersRoute, async (c) => {
  const db = c.get('db')
  const { eventId } = c.req.valid('param')
  
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

answersRouter.openapi(upsertEventAnswerRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const { eventId } = c.req.valid('param')
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
