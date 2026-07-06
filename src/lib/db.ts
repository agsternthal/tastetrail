import { createClient, type Client } from '@libsql/client'
import { env } from './env'

let _db: Client | null = null

export function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: env.tursoUrl(),
      authToken: env.tursoToken(),
    })
  }
  return _db
}
