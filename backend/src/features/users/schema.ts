import { z } from '@hono/zod-openapi'

export const UserSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440003', description: 'ユーザー内部ID' }),
  displayName: z.string().openapi({ example: '山田太郎', description: '表示名' }),
}).openapi('User')

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1, '表示名は必須です').openapi({ example: '山田 太郎' }),
}).openapi('UpdateUserRequest')
