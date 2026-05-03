import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import type { AppContext } from '../../core/types'
import { requireAuth } from '../../core/auth'
import { UserSchema, UpdateUserSchema } from './schema'
import { users } from '../../db/schema'

import { userAvailableRouter } from './available/router'

// create 
// ユーザーはKeycloakで管理するため、ユーザー作成APIは不要


// read
// ユーザー情報の取得
const getUserInfoRoute = createRoute({
    method: 'get',
    path: '/',
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
    path: '/',
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

// delete
// ユーザーはKeycloakで管理するため、ユーザー削除APIは不要

// --- API実装 ---

export const usersRouter = new OpenAPIHono<AppContext>()
  .route('/available', userAvailableRouter)
  .openapi(getUserInfoRoute, async (c) => {
    const user = c.get('appUser')!
    return c.json({
      id: user.id,
      displayName: user.displayName
    })
  })
  .openapi(updateUserInfoRoute, async (c) => {
    const db = c.get('db')
    const user = c.get('appUser')!
    const body = c.req.valid('json')
    
    const [updatedUser] = await db.update(users)
      .set({ displayName: body.displayName, updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id))
      .returning()

    return c.json({
      id: updatedUser.id,
      displayName: updatedUser.displayName,
    })
  })
