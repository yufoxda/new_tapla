import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { cors } from 'hono/cors'

import type { AppContext } from './core/types'
import { dbMiddleware } from './core/db'
import { errorHandler } from './core/error'

// Features
import { eventsRouter } from './features/events/router'
import { answersRouter } from './features/events/answers/router'
import { usersRouter } from './features/users/router'
import { userAvailableRouter } from './features/users/available/router'

const app = new OpenAPIHono<AppContext>()

// Global Middlewares
app.use('*', cors())
app.use('*', dbMiddleware)
app.onError(errorHandler)

// Feature Routes
app.route('/api/users', usersRouter)
app.route('/api/users/available', userAvailableRouter)
app.route('/api/events', eventsRouter)
// Note: answersRouter is now mounted under /api/events to match /api/events/:eventId/answers
app.route('/api/events', answersRouter)

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
