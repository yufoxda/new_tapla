import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import type { AppContext } from '../../../core/types'
import { AvailablePatternSchema } from './schema'
import { userAvailabilityPatterns } from '../../../db/schema'
import { requireAuth } from '../../../core/auth'

export const userAvailableRouter = new OpenAPIHono<AppContext>()

// create
// update に統合

// read
// 自分のマスター空き状況を取得
const getMyAvailabilityRoute = createRoute({
    method: 'get',
    path: '/',
    middleware: [requireAuth] as const,
    responses: {
        200: {
            content: { 'application/json': { schema: z.array(AvailablePatternSchema) } },
            description: 'ユーザーのマスター空き時間設定',
        },
    },
})

// update
// 自分のマスター空き状況を更新
const updateMyAvailabilityRoute = createRoute({
    method: 'put',
    path: '/',
    middleware: [requireAuth] as const,
    request: {
        body: {
            content: { 'application/json': { schema: z.array(AvailablePatternSchema) } },
            required: true,
        },
    },
    responses: {
        200: { description: '更新成功' },
    },
})

// delete は不要
// updateに統合


// Implementation
userAvailableRouter.openapi(getMyAvailabilityRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const results = await db.select().from(userAvailabilityPatterns).where(eq(userAvailabilityPatterns.userId, user.id))
  return c.json(results.map(r => ({
    id: r.id,
    startTime: r.startTime,
    endTime: r.endTime
  })))
})

userAvailableRouter.openapi(updateMyAvailabilityRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const body = c.req.valid('json')

  await db.transaction(async (tx) => {
    // 全削除して入れ直し
    await tx.delete(userAvailabilityPatterns).where(eq(userAvailabilityPatterns.userId, user.id))
    
    const records = body.map(item => ({
        userId: user.id,
        startTime: item.startTime,
        endTime: item.endTime,
    }))

    if (records.length > 0) {
        await tx.insert(userAvailabilityPatterns).values(records)
    }
  })

  return c.json({ success: true })
})
