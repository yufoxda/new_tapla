実装内容のサマリー

   1. 依存関係の追加
       * Neon Serverless Driver (@neondatabase/serverless) と Drizzle ORM (drizzle-orm)
       * JWT検証のための jose
       * マイグレーション用およびスキーマ生成用の drizzle-kit, drizzle-zod

   2. src/core/（横断的関心事）の実装
       * types.ts: HonoのContext用の型定義（CloudflareBindings, db, userのインジェクション用）。
       * db.ts: 1リクエストごとにNeonとのサーバーレスHTTP接続を初期化し、Hono Contextに db
         として注入するミドルウェア。
       * auth.ts: Keycloakから発行されたJWTを Authorization
         ヘッダから取得・検証（JWKS利用）し、認証されたユーザー情報をContextに注入するミドルウェア。
       * error.ts: システム全体のエラーハンドラー。

   3. src/features/（垂直スライス・ドメイン）の実装
       * events 機能
           * schema.ts: イベント関連のZod/OpenAPIスキーマ。
           * db.ts: Drizzle ORMの events テーブル定義（UUID自動生成を含む）。
           * router.ts: イベント一覧の取得、およびイベントの作成エンドポイント（要認証）。
       * answers 機能
           * schema.ts: 出欠回答のZod/OpenAPIスキーマ。
           * db.ts: Drizzle ORMの answers テーブル定義（event_id と user_id のユニーク制約付き）。
           * router.ts: 特定イベントの回答一覧取得、および回答のUpsertエンドポイント（要認証）。

   4. エントリーポイント (src/index.ts)
       * 上記で定義した各ルーター、ミドルウェア、CORS、エラーハンドラーを一元的にルーティングにマウント。
       * Swagger UI (/ui) および OpenAPIドキュメント (/doc) のセットアップ。
       * フロントエンドでのHono RPC連携のために AppType をexport。

   5. Drizzle設定ファイル
       * マイグレーションやスキーマ生成コマンド (npx drizzle-kit push 等) に備え、drizzle.config.ts
         をルートに作成。