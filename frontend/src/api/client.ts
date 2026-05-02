import { hc } from 'hono/client'
import type { AppType } from '../../../backend/src/index.ts'

// 本番環境（Cloudflare Pages）とローカル開発環境でのAPIベースURLを切り替える
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

// JWTをLocal Storage等から取得する簡易なヘルパー（本番運用では要検討）
export const getAuthToken = () => localStorage.getItem('auth_token')

export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem('auth_token', token)
  else localStorage.removeItem('auth_token')
}

// @ts-ignore - Monorepo環境でのHono AppTypeの完全な型推論に失敗するため一時的に無効化
export const client: any = hc<AppType>(API_URL, {
  headers: (): Record<string, string> => {
    const token = getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
})
