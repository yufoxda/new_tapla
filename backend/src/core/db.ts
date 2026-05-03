import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import type { Context, Next } from 'hono'
import type { AppContext } from './types'

// DBクライアントをHonoのContextに注入するミドルウェア
export const dbMiddleware = async (c: Context<AppContext>, next: Next) => {
  if (!c.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  // Neon HTTPクライアントとDrizzleインスタンスを作成
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(c.env.DATABASE_URL)

  c.set('db', db)

  await next()
}
