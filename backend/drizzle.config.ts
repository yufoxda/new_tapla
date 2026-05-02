import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: [
    './src/features/events/db.ts',
    './src/features/answers/db.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
