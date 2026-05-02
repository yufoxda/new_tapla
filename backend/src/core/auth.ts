import type { Context, Next } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AppContext } from './types'

export type User = {
  id: string
  email: string
  name: string
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
    c.set('user', { id: 'user_dev_123', email: 'dev@example.com', name: '開発ユーザー' })
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

    const user: User = {
      id: payload.sub as string,
      email: payload.email as string || '',
      name: payload.name as string || payload.preferred_username as string || '',
    }

    c.set('user', user)
    await next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401)
  }
}

// 認証を要求するエンドポイント向け
export const requireAuth = async (c: Context<AppContext>, next: Next) => {
  const user = c.get('user')
  if (!user) {
    // authMiddlewareを通っていない、あるいはパース失敗
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401)
  }
  await next()
}
