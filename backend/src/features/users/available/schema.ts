import { z } from '@hono/zod-openapi'

export const AvailableStatusEnum = z.enum(['attend', 'absent', 'pending'])

// 自動入力用エンドポイントのレスポンススキーマ
export const AutoFillStatusSchema = z.object({
  date: z.string().openapi({ example: '2026-05-01T18:00:00Z', description: '対象の日時' }),
  status: AvailableStatusEnum.openapi({ example: 'attend', description: '過去の回答に基づくステータス' }),
}).openapi('AutoFillStatus')
