import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, getTableColumns } from 'drizzle-orm'
import type { AppContext } from '../../core/types'
import { EventSchema, CreateEventSchema, UpdateEventSchema} from './schema'
import { events, eventDates, eventTimes, users } from '../../db/schema'
import { requireAuth } from '../../core/auth'

import { answersRouter } from './answers/router'

export const eventsRouter = new OpenAPIHono<AppContext>()
eventsRouter.route('/answers', answersRouter) // /api/events/:eventId/answers にマウント

// create
// 予定の作成
const createEventRoute = createRoute({
  method: 'post',
  path: '/',
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: { 'application/json': { schema: CreateEventSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: EventSchema } },
      description: '予定を作成',
    },
  },
})

// read
// 予定詳細の取得
const getEventByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: EventSchema } },
      description: '予定詳細',
    },
    404: { description: 'Not found' }
  },
})

// update
// 予定の更新
const updateEventRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateEventSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: EventSchema } },
      description: '予定が更新されました',
    },
    404: { description: 'Not found' }
  },
})

// delete
// 予定の削除
const deleteEventRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string().uuid() }) }, 
  responses: {
    204: { description: '予定が削除されました' },
    404: { description: 'Not found' }
  },
})



// --- API実装 ---
eventsRouter.openapi(createEventRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('appUser')!
  const body = c.req.valid('json')
  
  return await db.transaction(async (tx) => {
    const [newEvent] = await tx.insert(events).values({
      title: body.title,
      description: body.description || null,
      creatorId: user.id,
    }).returning()

    const dateRecords = body.dates.map((label, index) => ({
      eventId: newEvent.id,
      dateLabel: label,
      columnOrder: index,
    }))
    const insertedDates = await tx.insert(eventDates).values(dateRecords).returning()

    const timeRecords = body.times.map((label, index) => ({
      eventId: newEvent.id,
      timeLabel: label,
      rowOrder: index,
    }))
    const insertedTimes = await tx.insert(eventTimes).values(timeRecords).returning()

    return c.json({
      ...newEvent,
      creatorDisplayName: user.displayName,
      dates: insertedDates,
      times: insertedTimes,
    }, 201)
  })
})


eventsRouter.openapi(getEventByIdRoute, async (c) => {
  const db = c.get('db')
  const id = c.req.valid('param').id
  
  const [event] = await db.select({
    ...getTableColumns(events),
    creatorDisplayName: users.displayName
  }).from(events)
    .leftJoin(users, eq(events.creatorId, users.id))
    .where(eq(events.id, id))
    
  if (!event) return c.json({ error: 'Not found' }, 404)

  const dates = await db.select().from(eventDates).where(eq(eventDates.eventId, event.id)).orderBy(eventDates.columnOrder)
  const times = await db.select().from(eventTimes).where(eq(eventTimes.eventId, event.id)).orderBy(eventTimes.rowOrder)

  return c.json({ ...event, dates, times })
})

eventsRouter.openapi(updateEventRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('appUser')!
  const id = c.req.valid('param').id
  const body = c.req.valid('json')
  const now = new Date().toISOString()

  const [existing] = await db.select().from(events).where(eq(events.id, id))
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.creatorId !== user.id) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return await db.transaction(async (tx) => {
    const updatedEvent = await tx.update(events).set({
      title: body.title,
      description: body.description || null,
      updatedAt: now,
    }).where(eq(events.id, id)).returning()
    return c.json(updatedEvent)
  })
})

eventsRouter.openapi(deleteEventRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('appUser')!
  const id = c.req.valid('param').id

  const [existing] = await db.select().from(events).where(eq(events.id, id))
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.creatorId !== user.id) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await db.delete(events).where(eq(events.id, id))
  return c.body(null, 204)
})

