import { z } from '@hono/zod-openapi'

export const AvailablePatternSchema = z.object({
  id: z.string().uuid().optional(),
  startTime: z.string().openapi({ example: '2026-04-27T18:00:00Z' }),
  endTime: z.string().openapi({ example: '2026-04-27T19:00:00Z' }),
}).openapi('AvailablePattern')

// 既存のフロントエンドとの互換性のための暫定スキーマ（必要に応じて）
export const AutoFillStatusSchema = z.object({
  date: z.string(),
  status: z.enum(['attend', 'absent', 'pending']),
}).openapi('AutoFillStatus')
