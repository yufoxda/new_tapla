import { z } from '@hono/zod-openapi'

export const AnswerStatusEnum = z.enum(['attend', 'absent', 'pending'])

// 各セルの投票データ
export const CellVoteSchema = z.object({
  eventDateId: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  eventTimeId: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440001' }),
  status: AnswerStatusEnum.openapi({ example: 'attend' }),
})

// イベント回答者ごとのデータ
export const AnswerSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440004', description: 'voteuser ID' }),
  userId: z.string().uuid().nullable().openapi({ example: '550e8400-e29b-41d4-a716-446655440003' }),
  userLabel: z.string().openapi({ example: '山田太郎', description: 'そのイベントでの名前' }),
  comment: z.string().nullable().openapi({ example: '遅れて参加します' }),
  updatedAt: z.string().openapi({ example: '2026-04-27T10:00:00Z' }),
  votes: z.array(CellVoteSchema),
}).openapi('Answer')

// 投票（Upsert）リクエスト
export const UpsertAnswerSchema = z.object({
  userLabel: z.string().min(1, '名前は必須です').openapi({ example: '山田太郎' }),
  comment: z.string().optional().openapi({ example: '遅れて参加します' }),
  votes: z.array(CellVoteSchema).min(1, '少なくとも1つのマスへの投票が必要です'),
}).openapi('UpsertAnswerRequest')
