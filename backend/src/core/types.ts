import type { NeonDatabase } from 'drizzle-orm/neon-serverless'
import type { appUser } from './auth' // Will be defined in auth.ts

export type CloudflareBindings = {
  DATABASE_URL: string
  KEYCLOAK_ISSUER: string // For JWT verification
}

export type AppContext = {
  Bindings: CloudflareBindings
  Variables: {
    db: NeonDatabase
    appUser?: appUser
  }
}
