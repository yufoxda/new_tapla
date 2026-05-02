import { z } from '@hono/zod-openapi'


export const CreateEventSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').openapi({ example: 'アンサンブル合同練習' }),
  description: z.string().optional().openapi({ example: '全パート集まっての練習です' }),
  candidates_date: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式はYYYY-MM-DDである必要があります')).min(1, '少なくとも1つの候補日が必要です').openapi({
    example: ['2026-05-01', '2026-05-02'],
    description: '候補日付の配列（YYYY-MM-DD形式）'
  }),
  candidates_time: z.array(z.string().regex(/^\d{2}:\d{2}$/, '時刻形式はHH:mmである必要があります')).min(1, '少なくとも1つの候補時刻が必要です').openapi({
    example: ['18:00', '19:00'],
    description: '候補時刻の配列（HH:mm形式）'
  }),
}).openapi('CreateEventRequest')

export const EventSchema = z.object({
  id: z.string().openapi({ example: 'evt_123', description: 'イベントID' }),
  title: z.string().openapi({ example: 'アンサンブル合同練習', description: 'イベント名' }),
  description: z.string().nullable().openapi({ example: '全パート集まっての練習です', description: 'イベント詳細' }),
  creatorDisplayName: z.string().openapi({ example: '山田太郎', description: '作成者表示名' }),
  creatorId: z.string().openapi({ example: 'user_123', description: '作成者ID' }),
  createdAt: z.string().openapi({ example: '2026-04-27T10:00:00Z', description: '作成日時' }),
  candidates_date: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式はYYYY-MM-DDである必要があります')).openapi({
    example: ['2026-05-01', '2026-05-02'],
    description: '候補日付一覧（YYYY-MM-DD形式）'
  }),
  candidates_time: z.array(z.string().regex(/^\d{2}:\d{2}$/, '時刻形式はHH:mmである必要があります')).openapi({
    example: ['18:00', '19:00'],
    description: '候補時刻一覧（HH:mm形式）'
  }),
}).openapi('Event')

export const UpdateEventSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').optional().openapi({ example: 'アンサンブル合同練習' }),
  description: z.string().optional().openapi({ example: '全パート集まっての練習です' }),
  candidates_date: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式はYYYY-MM-DDである必要があります')).optional().openapi({
    example: ['2026-05-01', '2026-05-02'],
    description: '候補日付の配列（YYYY-MM-DD形式）'
  }),
  candidates_time: z.array(z.string().regex(/^\d{2}:\d{2}$/, '時刻形式はHH:mmである必要があります')).optional().openapi({
    example: ['18:00', '19:00'],
    description: '候補時刻の配列（HH:mm形式）'
  }),
}).openapi('UpdateEventRequest')

// delleteはリクエストボディなし