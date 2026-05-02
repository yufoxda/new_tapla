import { z } from '@hono/zod-openapi'

export const AnswerStatusEnum = z.enum(['attend', 'absent', 'pending'])

export const CandidateAnswerSchema = z.object({
  candidateId: z.string().openapi({ example: 'cand_123', description: '候補ID' }),
  status: AnswerStatusEnum.openapi({ example: 'attend', description: '出欠ステータス' }),
})

export const AnswerSchema = z.object({
  eventId: z.string().openapi({ example: 'evt_123', description: '対象イベントID' }),
  userId: z.string().openapi({ example: 'usr_123', description: 'ユーザーID' }),
  comment: z.string().nullable().openapi({ example: '遅れて参加します', description: 'イベントに対するコメント' }),
  updatedAt: z.string().openapi({ example: '2026-04-27T10:00:00Z', description: '最終更新日時' }),
  candidateAnswers: z.array(CandidateAnswerSchema).openapi({ description: '各候補日時の出欠回答' }),
}).openapi('Answer')

export const UpsertAnswerSchema = z.object({
  comment: z.string().optional().openapi({ example: '遅れて参加します' }),
  candidateAnswers: z.array(CandidateAnswerSchema).min(1, '少なくとも1つの候補日に対する回答が必要です').openapi({ description: '各候補日時の出欠回答' }),
}).openapi('UpsertAnswerRequest')

// 自動入力用エンドポイントのレスポンススキーマ
export const AutoFillStatusSchema = z.object({
  date: z.string().openapi({ example: '2026-05-01T18:00:00Z', description: '対象の日時' }),
  status: AnswerStatusEnum.openapi({ example: 'attend', description: '過去の回答に基づくステータス' }),
}).openapi('AutoFillStatus')
