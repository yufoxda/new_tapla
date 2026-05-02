import { z } from '@hono/zod-openapi'

// 候補日（列）のスキーマ
export const EventDateSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  dateLabel: z.string().openapi({ example: '2026-05-01', description: '日付ラベル' }),
  columnOrder: z.number().openapi({ example: 1 }),
})

// 候補時間（行）のスキーマ
export const EventTimeSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440001' }),
  timeLabel: z.string().openapi({ example: '18:00', description: '時間ラベル' }),
  rowOrder: z.number().openapi({ example: 1 }),
})

export const CreateEventSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').openapi({ example: 'アンサンブル合同練習' }),
  description: z.string().optional().openapi({ example: '全パート集まっての練習です' }),
  dates: z.array(z.string()).min(1, '少なくとも1つの候補日が必要です').openapi({
    example: ['2026-05-01', '2026-05-02'],
    description: '候補日付の配列（自由な文字列またはYYYY-MM-DD）'
  }),
  times: z.array(z.string()).min(1, '少なくとも1つの候補時刻が必要です').openapi({
    example: ['18:00', '19:00'],
    description: '候補時刻の配列（自由な文字列またはHH:mm）'
  }),
}).openapi('CreateEventRequest')

export const EventSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440002' }),
  title: z.string().openapi({ example: 'アンサンブル合同練習' }),
  description: z.string().nullable().openapi({ example: '全パート集まっての練習です' }),
  creatorId: z.string().uuid().nullable().openapi({ example: '550e8400-e29b-41d4-a716-446655440003' }),
  creatorDisplayName: z.string().openapi({ example: '山田太郎' }),
  createdAt: z.string().openapi({ example: '2026-04-27T10:00:00Z' }),
  dates: z.array(EventDateSchema),
  times: z.array(EventTimeSchema),
}).openapi('Event')

export const UpdateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  // 候補日時の大幅な変更（削除や追加）は複雑なため、今回はタイトルと説明のみに限定するか、
  // あるいはフロントエンド側で全削除・全再作成を許容する設計にする。
}).openapi('UpdateEventRequest')
