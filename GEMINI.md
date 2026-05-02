# GEMINI.md - Circle Scheduling App (サークル予定調整アプリ)

## 📌 Project Overview
A web application for circle members (approx. 30 people) to coordinate schedules. Built as a monorepo with a clear separation between frontend and backend, optimized for Cloudflare's edge environment.

- **Architecture:** Monorepo (backend/frontend)
- **Deployment:** Cloudflare Workers (Backend) / Cloudflare Pages (Frontend)
- **Backend:** Hono, `@hono/zod-openapi`, Drizzle ORM
- **Frontend:** React (Vite), Tailwind CSS
- **Database:** Neon (Serverless Postgres)
- **Authentication:** Keycloak (OIDC) with JWT verification in backend
- **Communication:** Hono RPC (Type-safe)

---

## 🏗️ Technical Standards & Rules

### 1. Vertical Slice Architecture
- **Rule:** Organize code by functional features (domains) rather than technical layers.
- **Directories:** Each feature in `backend/src/features/` must contain its own `schema.ts`, `router.ts`, and `db.ts`.
- **Constraint:** NEVER create `controllers/`, `services/`, or `models/` directories. Avoid tight coupling between features.

### 2. Schema-Driven Development
- **Workflow:** Define or update Zod schemas in `schema.ts` **FIRST** before implementing API logic.
- **OpenAPI:** Use `@hono/zod-openapi` to automatically generate OpenAPI specifications.
- **Type Safety:** Use Hono RPC to share types between backend and frontend.

### 3. Dependency Injection (DI) & Context
- **Pattern:** Use Hono's `Context (c.set / c.get)` for shared concerns.
- **Core:** Global utilities and middlewares are defined in `backend/src/core/`.
- **Constraint:** Do not introduce heavy DI containers (e.g., InversifyJS).

### 4. Authentication Flow
- **Frontend:** Responsible for OIDC communication with Keycloak to obtain JWTs.
- **Backend:** Verifies JWTs via `backend/src/core/auth.ts` middleware and populates `c.get('user')`.
- **Constraint:** Backend does not handle login rendering or redirects.
### others
dont del comments
---

## 🛠️ Key Commands

### Backend (`/backend`)
- `npm run dev`: Start local development server with Wrangler.
- `npm run deploy`: Deploy to Cloudflare Workers.
- `npm run cf-typegen`: Generate Cloudflare environment bindings.
- `npx drizzle-kit push`: Sync schema changes to database (Drizzle).

### Frontend (`/frontend`)
- `npm run dev`: Start Vite development server.
- `npm run build`: Build for production (Cloudflare Pages).
- `npm run lint`: Run ESLint.

---

## 📂 Core Directory Structure

```text
/
├── backend/
│   ├── src/
│   │   ├── core/         # Cross-cutting concerns (DB, Auth, Error Handling)
│   │   ├── features/     # Feature-based vertical slices
│   │   │   ├── events/   # Example: event management (schema.ts, router.ts, db.ts)
│   │   │   └── answers/  # Example: attendance answers
│   │   └── index.ts      # Entry point (Feature registration & Global Middlewares)
│   ├── drizzle.config.ts # DB schema & migration config
│   └── wrangler.jsonc    # Cloudflare Workers configuration
└── frontend/
    ├── src/
    │   ├── api/          # Hono RPC client initialization
    │   ├── features/     # UI features & domain logic
    │   └── components/   # Shared UI components
    └── vite.config.ts    # Frontend build config
```

## 🚀 Development Workflow for AI
When implementing new features:
1.  **Define Schema:** Create `backend/src/features/[feature]/schema.ts` using Zod.
2.  **Implement Router:** Create `backend/src/features/[feature]/router.ts` using `@hono/zod-openapi`.
3.  **Implement DB:** Create `backend/src/features/[feature]/db.ts` for database operations.
4.  **Register Route:** Import and mount the new router in `backend/src/index.ts`.
5.  **Frontend Call:** Use the generated Hono RPC client in the frontend to call the API.
