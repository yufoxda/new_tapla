import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'

import type { AppContext } from './core/types'
import { dbMiddleware } from './core/db'
import { authMiddleware } from './core/auth'
import { errorHandler } from './core/error'

// Features
import { eventsRouter } from './features/events/router'
import { answersRouter } from './features/answers/router'

const app = new OpenAPIHono<AppContext>()

// Global Middlewares
app.use('*', cors())
app.use('*', dbMiddleware)
// app.use('*', authMiddleware)
app.onError(errorHandler)

// Feature Routes
app.route('/api/events', eventsRouter)
app.route('/api/answers', answersRouter)


// OpenAPI & Swagger UI
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Circle Scheduling API',
    description: 'API for Circle Scheduling App',
  },
})

app.get('/ui', swaggerUI({ url: '/doc' }))

// Export type for Hono RPC in frontend
export type AppType = typeof app

export default app
