import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { eq, inArray } from 'drizzle-orm'
import type { AppContext } from '../../core/types'
import { EventSchema, CreateEventSchema, UpdateEventSchema } from './schema'
import { events } from './db'
import { eventAnswers } from '../answers/db'
import { requireAuth } from '../../core/auth'

export const eventsRouter = new OpenAPIHono<AppContext>()

// read 
// 自分が作った予定を取得
const getMyEventsRoute = createRoute({
  method: 'get',
  path: '/my',
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(EventSchema) } },
      description: '自分が作成した予定一覧',
    },
  },
})

// 自分が投票した予定を取得
const getVotedEventsRoute = createRoute({
  method: 'get',
  path: '/voted',
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(EventSchema) } },
      description: '自分が投票した予定一覧',
    },
  },
})

// IDで予定を取得
const getEventByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: EventSchema } },
      description: '予定詳細',
    },
    404: { description: 'Not found' }
  },
})

// create
// 予定を作成
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

// update
// 予定を更新（作成者のみ）
const updateEventRoute = createRoute({
  method: 'put',
  path: '/{id}',
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { 'application/json': { schema: UpdateEventSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: EventSchema } },
      description: '予定を更新',
    },
    403: { description: '作成者のみ更新可能' },
    404: { description: 'Not found' }
  },
})

// delete
// 予定を削除（作成者のみ）
const deleteEventRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    204: { description: '予定を削除' },
    403: { description: '作成者のみ削除可能' },
    404: { description: 'Not found' }
  },
})

// ルートとハンドラーの紐付け
eventsRouter.openapi(getMyEventsRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const results = await db.select().from(events).where(eq(events.creatorId, user.id))
  return c.json(results)
})

eventsRouter.openapi(getVotedEventsRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  
  const userAnswers = await db.select().from(eventAnswers).where(eq(eventAnswers.userId, user.id))
  const eventIds = userAnswers.map(a => a.eventId)
  
  if (eventIds.length === 0) return c.json([])
  
  const results = await db.select().from(events).where(inArray(events.id, eventIds))
  return c.json(results)
})

eventsRouter.openapi(getEventByIdRoute, async (c) => {
  const db = c.get('db')
  const id = c.req.valid('param').id
  const [event] = await db.select().from(events).where(eq(events.id, id))
  if (!event) return c.json({ error: 'Not found' }, 404)
  return c.json(event)
})

eventsRouter.openapi(createEventRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const body = c.req.valid('json')
  
  const [newEvent] = await db.insert(events).values({
    title: body.title,
    description: body.description || null,
    creatorDisplayName: user.name || user.email || 'unknown',
    creatorId: user.id,
    candidates_date: body.candidates_date,
    candidates_time: body.candidates_time,
  }).returning()

  return c.json(newEvent, 201)
})

eventsRouter.openapi(updateEventRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const id = c.req.valid('param').id
  const body = c.req.valid('json')
  
  const [event] = await db.select().from(events).where(eq(events.id, id))
  if (!event) return c.json({ error: 'Not found' }, 404)
  if (event.creatorId !== user.id) return c.json({ error: '作成者のみ更新可能' }, 403)
  
  const updateData: Record<string, any> = {}
  if (body.title !== undefined) updateData.title = body.title
  if (body.description !== undefined) updateData.description = body.description
  if (body.candidates_date !== undefined) updateData.candidates_date = body.candidates_date
  if (body.candidates_time !== undefined) updateData.candidates_time = body.candidates_time
  
  const [updatedEvent] = await db.update(events).set(updateData).where(eq(events.id, id)).returning()
  return c.json(updatedEvent)
})

eventsRouter.openapi(deleteEventRoute, async (c) => {
  const db = c.get('db')
  const user = c.get('user')!
  const id = c.req.valid('param').id
  
  const [event] = await db.select().from(events).where(eq(events.id, id))
  if (!event) return c.json({ error: 'Not found' }, 404)
  if (event.creatorId !== user.id) return c.json({ error: '作成者のみ削除可能' }, 403)
  
  await db.delete(events).where(eq(events.id, id))
  return c.body(null, 204)
})