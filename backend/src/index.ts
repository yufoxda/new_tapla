import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'

import type { AppContext } from './core/types'
import { dbMiddleware } from './core/db'
import { authMiddleware } from './core/auth'
import { errorHandler } from './core/error'

// Features
import { eventsRouter } from './features/events/router'
import { usersRouter } from './features/users/router'

const app = new OpenAPIHono<AppContext>()
  .use('*', cors())
  .use('*', dbMiddleware)
  .use('/api/users/*', authMiddleware)
  .get('/doc', (c): Response => {
    return c.json((app as OpenAPIHono<AppContext>).getOpenAPI31Document({
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'API Documentation',
        description: 'Hono + Zod-OpenAPIを使用したAPI',
      },
    }));
  })
  .get('/ui', swaggerUI({ url: '/doc' }))
  .get('/health', (c): Response => c.json({ status: 'ok' }))
  .route('/api/users', usersRouter)
  .route('/api/events', eventsRouter)
  .onError(errorHandler)

// Export type for Hono RPC in frontend
export type AppType = typeof app

export default app
