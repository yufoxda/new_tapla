import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import type { User } from './auth' // Will be defined in auth.ts

export type CloudflareBindings = {
  DATABASE_URL: string
  KEYCLOAK_ISSUER: string // For JWT verification
}

export type AppContext = {
  Bindings: CloudflareBindings
  Variables: {
    db: NeonHttpDatabase<any>
    user?: User
  }
}
