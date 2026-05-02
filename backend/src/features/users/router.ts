import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import type { AppContext } from '../../core/types'
import { requireAuth } from '../../core/auth'
import { UserSchema, UpdateUserSchema } from './schema'
import { users } from '../../db/schema'

export const usersRouter = new OpenAPIHono<AppContext>()

// read
// ユーザー情報の取得
const getUserInfoRoute = createRoute({
    method: 'get',
    path: '/me',
    middleware: [requireAuth] as const,
    responses: {
        200: {
            content: { 'application/json': { schema: UserSchema } },
            description: 'ユーザー情報',
        },
    },
})


//update
// ユーザー情報の更新
const updateUserInfoRoute = createRoute({
    method: 'put',
    path: '/me',
    middleware: [requireAuth] as const,
    request: {
        body: {
            content: { 'application/json': { schema: UpdateUserSchema } },
            required: true,
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: UserSchema } },
            description: 'ユーザー情報が更新されました',
        },
    },
})

// --- API実装 ---

usersRouter.openapi(getUserInfoRoute, async (c) => {
  const user = c.get('user')!
  return c.json(user)
})

usersRouter.openapi(updateUserInfoRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const body = c.req.valid('json')
  
  const [updatedUser] = await db.update(users)
    .set({ displayName: body.displayName })
    .where(eq(users.id, user.id))
    .returning()

  // セッションのユーザー情報も更新されたものとして扱う場合があるが、
  // Workerのこのリクエストスコープ内では特に必要なし
  return c.json({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    displayName: updatedUser.displayName,
  })
})
