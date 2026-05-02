import type { Context, Next } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AppContext } from './types'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export type authUser = {
  id: string
  email: string
  name: string
}

export type appUser = {
  id: string
  email: string
  name: string
  displayName: string
}

// Keycloak等のJWKSエンドポイントから公開鍵を取得するためのキャッシュ用変数
// Workerが再起動するまではキャッシュされる
let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null

export const authMiddleware = async (c: Context<AppContext>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' }, 401)
  }

  const token = authHeader.split(' ')[1]

  // --- MOCK AUTH FOR DEVELOPMENT ---
  if (token === 'dev-token') {
    c.set('appUser', { id: '550e8400-e29b-41d4-a716-446655440003', email: 'dev@example.com', name: '開発ユーザー', displayName: '開発ユーザー' })
    return await next()
  }
  // ---------------------------------

  try {
    const issuer = c.env.KEYCLOAK_ISSUER
    if (!issuer) {
      console.warn('KEYCLOAK_ISSUER is not set in environment bindings. Bypassing verify for local dev if missing, but failing safely.')
      throw new Error('KEYCLOAK_ISSUER is not configured')
    }

    if (!JWKS) {
      // KeycloakのOIDC ConfigurationからJWKSエンドポイントを推測
      const jwksUrl = new URL(`${issuer}/protocol/openid-connect/certs`)
      JWKS = createRemoteJWKSet(jwksUrl)
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: issuer,
      // audience検証も必要に応じて追加
    })

    const authId = payload.sub as string
    const email = (payload.email as string) || ''
    const name = (payload.preferred_username as string) || (payload.name as string) || ''
    const displayName = (payload.name as string) || (payload.preferred_username as string) || 'Unknown User'

    const db = c.get('db')
    const existingUser = await db.select().from(users).where(eq(users.authUserId, authId))

    let appUser: appUser

    if (existingUser.length === 0) {
      const inserted = await db.insert(users).values({
        authUserId: authId,
        displayName: displayName,
      }).returning()

      appUser = {
        id: inserted[0].id,
        email,
        name,
        displayName: inserted[0].displayName,
      }
    } else {
      appUser = {
        id: existingUser[0].id,
        email,
        name,
        displayName: existingUser[0].displayName,
      }
    }

    c.set('appUser', appUser)
    await next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401)
  }
}

// 認証を要求するエンドポイント向け
export const requireAuth = async (c: Context<AppContext>, next: Next) => {
  const user = c.get('appUser')
  if (!user) {
    // authMiddlewareを通っていない、あるいはパース失敗
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401)
  }
  await next()
}
