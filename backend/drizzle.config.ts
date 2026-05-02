import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: [
    './src/features/users/db.ts',
    './src/features/events/db.ts',
    './src/features/answers/db.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // @ts-ignore
    url: process.env.DATABASE_URL!,
  },
})
