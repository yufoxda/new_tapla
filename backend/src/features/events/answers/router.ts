import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, and } from 'drizzle-orm'
import type { AppContext } from '../../../core/types'
import { AnswerSchema, UpsertAnswerSchema } from './schema'
import { voteUsers, votes } from '../../../db/schema'

export const answersRouter = new OpenAPIHono<AppContext>()

// create
// update に統合


// read
// 予定に対する全回答を取得
const getEventAnswersRoute = createRoute({
  method: 'get',
  path: '/',//api/events/{eventId}/answers
  request: { params: z.object({ eventId: z.string().uuid() }) },
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
    path: '/',//api/events/{eventId}/answers
    request: {
      params: z.object({ eventId: z.string().uuid() }),
      body: { content: { 'application/json': { schema: UpsertAnswerSchema } }, required: true }
    },
    responses: {
      200: { content: { 'application/json': { schema: AnswerSchema } }, description: 'OK' }
    }
})

// delete
// updateに統合

// --- API実装 ---

answersRouter.openapi(getEventAnswersRoute, async (c) => {
  const db = c.get('db')
  const { eventId } = c.req.valid('param')
  
  const allVoteUsers = await db.select().from(voteUsers).where(eq(voteUsers.voteId, eventId))
  // todo: N+1問題。回答者が多いとパフォーマンスが悪化するため、JOINでまとめて取るなどの対策が必要
  // todo: trueのみで絞る
  const results = await Promise.all(allVoteUsers.map(async (vu) => {
    const userVotes = await db.select().from(votes).where(eq(votes.voteUserId, vu.id))
    return {
      id: vu.id,
      userId: vu.userId,
      userDisplayname: vu.userLabel,
      updatedAt: vu.updatedAt,
      votes: userVotes.map(v => ({
        eventDateId: v.eventDateId,
        eventTimeId: v.eventTimeId,
        status: v.status
      }))
    }
  }))

  return c.json(results)
})

answersRouter.openapi(upsertEventAnswerRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('appUser')
  const { eventId } = c.req.valid('param')
  const body = c.req.valid('json')
  const now = new Date().toISOString()

  return await db.transaction(async (tx) => {
    // 1. voteuser を Upsert
    if (!user) {
      // guestuser
      const [res] = await tx.insert(voteUsers).values({
          userId: null,
          voteId: eventId,
          userLabel: body.userLabel,
          comment: body.comment || null,
          updatedAt: now
      }).returning()
      const voteUserId = res.id

      // 2. votes を Insert
      const voteRecords = body.votes.map(v => ({
          voteUserId,
          eventId,
          eventDateId: v.eventDateId,
          eventTimeId: v.eventTimeId,
          status: v.status,
          votedAt: now
      }))

      if (voteRecords.length > 0) {
          await tx.insert(votes).values(voteRecords)
      }
      return c.json({
          id: res.id,
          userId: res.userId,
          userLabel: res.userLabel,
          comment: res.comment,
          updatedAt: res.updatedAt,
          votes: body.votes
      })
    } else {
      // login user
      
      const existing = await tx.select().from(voteUsers).where(
          and(eq(voteUsers.userId, user.id), eq(voteUsers.voteId, eventId))
      )

      let voteUserId: string
      let updatedVU: any

      if (existing.length > 0) {
        // 既に回答済み
          voteUserId = existing[0].id
          const [res] = await tx.update(voteUsers).set({
              updatedAt: now
          }).where(eq(voteUsers.id, voteUserId)).returning()
          updatedVU = res
      } else {
        // 初めての回答
          const [res] = await tx.insert(voteUsers).values({
              userId: user.id,
              voteId: eventId,
              userLabel: body.userLabel,
              comment: body.comment || null,
              updatedAt: now
          }).returning()
          voteUserId = res.id
          updatedVU = res
      }

      // 2. votes を更新
      // todo: 差分更新。現状は全削除して入れ直し
      await tx.delete(votes).where(eq(votes.voteUserId, voteUserId))

      const voteRecords = body.votes.map(v => ({
          voteUserId,
          eventId,
          eventDateId: v.eventDateId,
          eventTimeId: v.eventTimeId,
          status: v.status,
          votedAt: now
      }))

      if (voteRecords.length > 0) {
          await tx.insert(votes).values(voteRecords)
      }

      return c.json({
          id: updatedVU.id,
          userId: updatedVU.userId,
          userLabel: updatedVU.userLabel,
          comment: updatedVU.comment,
          updatedAt: updatedVU.updatedAt,
          votes: body.votes
      })
    }
  })
})