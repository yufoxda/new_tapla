# Circle Scheduling App (サークル予定調整アプリ)

## 📌 Project Overview
サークルメンバー（約30名）向けの予定調整アプリケーション。
フロントエンドとバックエンドを明確に分離したMonorepo構成とし、Cloudflareのエッジ環境で高速に動作させることを目的とする。

## 🏗️ Architecture & Tech Stack
- **Infrastructure:** Cloudflare Workers (Backend) / Cloudflare Pages (Frontend)
- **Backend:** Hono, `@hono/zod-openapi`
- **Frontend:** React (Vite), Tailwind CSS
- **Database:** Neon (Serverless Postgres), Drizzle ORM
- **Authentication:** Keycloak (OIDC)
- **Type Sharing:** Hono RPC

---

## 🛑 STRICT RULES FOR AI AGENTS (開発ガイドライン)
AIエージェントはコードを生成する際、以下のルールを**絶対**に遵守すること。

### 1. 垂直スライス・アーキテクチャ (Vertical Slice Architecture)
- **禁止事項:** `controllers/`, `services/`, `models/` のような技術レイヤーによる水平分割（ディレクトリ作成）を絶対にしないこと。
- **ルール:** 機能（ドメイン）ごとにディレクトリを分割し、その中にスキーマ、ルーティング、DBアクセスロジックを同梱すること。
- 他のドメインのロジックを安易にインポートして結合度を上げないこと。

### 2. スキーマ駆動開発 (Schema-Driven)
- APIエンドポイントを追加・修正する際は、**必ず最初にZodスキーマを定義または更新すること。**
- `@hono/zod-openapi` を使用してOpenAPI仕様を自動生成させること。
- バックエンドとフロントエンドの通信には `Hono RPC` を使用し、型安全性を担保すること。

### 3. DIと共通基盤 (Core vs Features)
- **禁止事項:** InversifyJSやTSyringeなどの重いDIコンテナライブラリを導入しないこと。
- **ルール:** DBクライアントや認証情報などの横断的関心事は `src/core/` で定義し、Honoの `Context (c.set / c.get)` を使って各機能（features）へ注入すること。

### 4. 認証フロー (Authentication)
- フロントエンド（React）側でKeycloakとOIDC通信を行い、JWT（アクセストークン）を取得する。
- バックエンド（Hono）は、リクエストヘッダのJWTを `core/auth.ts` のミドルウェアで検証し、ユーザー情報をContextにセットする。バックエンド側でログイン画面のレンダリングやリダイレクト処理を書かないこと。

### その他
コメントは消さないでください。

---

## 📂 Directory Structure

プロジェクトはnpm workspaces（またはTurborepo）によるMonorepoを想定する。

```text
/
├─ packages/
│  └─ shared/             # (Optional) 共通のZodスキーマや定数
│
├─ frontend/           # React (Vite cloudflare pages)
├  ├─ src/
│  ├─ api/          # Hono RPCクライアントの初期化
│  │  ├─ components/   # UIコンポーネント
│  │  └─ features/     # フロント側の機能ごとの分割
│  └─ package.json
│
├─ backend/            # Hono (Cloudflare Workers)
│     ├─ src/
│     │  ├─ core/         # 【重要】横断的関心事（DB接続, 認証ミドルウェア, エラーハンドラ）
│     │  ├─ features/     # 【重要】機能ごとの垂直スライス
│     │  │  ├─ events/    # 例：イベント機能 (schema.ts, router.ts, db.ts を同梱)
│     │  │  └─ answers/   # 例：出欠回答機能
│     │  └─ index.ts      # エントリーポイント。各featureのルーターをマウント
│     ├─ wrangler.toml
│     └─ package.json
└─ package.json           # Monorepo Root

```

🚀 Development Workflow for AI
新しい機能を作成する際のステップ：
1. apps/backend/src/features/[機能名]/schema.ts にZodでリクエスト/レスポンスの型を定義する。
1. 同ディレクトリの router.ts に @hono/zod-openapi を用いてエンドポイントを実装する。
1. apps/frontend/ 側で Hono RPC クライアント経由でAPIを呼び出すUIを構築する。

