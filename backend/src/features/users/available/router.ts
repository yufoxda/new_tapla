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
    path: '/', // /users/available
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
    path: '/', // /users/available
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


// --- API実装 ---
userAvailableRouter.openapi(getMyAvailabilityRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('appUser')!
  const results = await db.select().from(userAvailabilityPatterns)
                            .where(eq(userAvailabilityPatterns.userId, user.id))

  return c.json(results.map(r => ({
    startTime: r.startTime,
    endTime: r.endTime
  })))
})

userAvailableRouter.openapi(updateMyAvailabilityRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('appUser')!
  const body = c.req.valid('json')

  // todo: マージロジックを入れる。現状は全削除して入れ直し
  // todo: バリデーション。重複や、startTime < endTimeなど
  await db.transaction(async (tx) => {
    
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
