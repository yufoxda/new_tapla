import { z } from '@hono/zod-openapi'

export const UserSchema = z.object({
  id: z.string().openapi({ example: 'usr_123', description: 'ユーザー内部ID' }),
  email: z.string().openapi({ example: 'test@example.com', description: 'メールアドレス' }),
  name: z.string().openapi({ example: 'taro_yamada', description: 'ユーザー名（システム用）' }),
  displayName: z.string().openapi({ example: '山田太郎', description: '表示名' }),
}).openapi('User')

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1, '表示名は必須です').openapi({ example: '山田 太郎' }),
}).openapi('UpdateUserRequest')
