import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, inArray, and } from 'drizzle-orm'
import type { AppContext } from '../../../core/types'
import { AutoFillStatusSchema } from './schema'
import { userGlobalAvailability } from '../../../db/schema'
import { requireAuth } from '../../../core/auth'

export const userAvailableRouter = new OpenAPIHono<AppContext>()

// read
// ユーザーの空き時間情報の取得
const getUserInfoRoute = createRoute({
    method: 'get',
    path: '/',
    middleware: [requireAuth] as const,
    responses: {
        200: {
            content: { 'application/json': { schema: z.array(AutoFillStatusSchema) } },
            description: 'ユーザーの空き時間情報',
        },
    },
})


//update
// ユーザーの空き時間情報の更新
const updateUserInfoRoute = createRoute({
    method: 'put',
    path: '/',
    middleware: [requireAuth] as const,
    request: {
        body: {
            content: { 'application/json': { schema: z.array(AutoFillStatusSchema) } },
            required: true,
        },
    },
    responses: {
        200: {
            description: 'ユーザーの空き時間情報が更新されました',
        },
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

userAvailableRouter.openapi(getUserInfoRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const results = await db.select().from(userGlobalAvailability).where(eq(userGlobalAvailability.userId, user.id))
  return c.json(results.map(r => ({ date: r.date, status: r.status as 'attend' | 'absent' | 'pending' })))
})

userAvailableRouter.openapi(updateUserInfoRoute, async (c) => {
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

userAvailableRouter.openapi(getAutoFillRoute, async (c) => {
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
  return c.json(results.map(r => ({ date: r.date, status: r.status as 'attend' | 'absent' | 'pending' })))
})
