import 'server-only'
import { randomUUID } from 'crypto'
import { getDb } from '../db'
import type { User } from '@/types'

export async function upsertUserByEmail(email: string): Promise<User> {
  const db = getDb()
  const normalized = email.trim().toLowerCase()

  const found = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [normalized],
  })
  if (found.rows[0]) {
    const r = found.rows[0]
    return { id: String(r.id), email: String(r.email), created_at: String(r.created_at) }
  }

  const user: User = {
    id: randomUUID(),
    email: normalized,
    created_at: new Date().toISOString(),
  }
  await db.execute({
    sql: 'INSERT INTO users (id, email, created_at) VALUES (?,?,?)',
    args: [user.id, user.email, user.created_at],
  })
  return user
}
