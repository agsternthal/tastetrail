import 'server-only'
import { redirect } from 'next/navigation'
import { getDb } from '../db'
import { readSession } from './session'
import type { User } from '@/types'

export async function currentUser(): Promise<User | null> {
  const session = await readSession()
  if (!session) return null
  const db = getDb()
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [session.userId] })
  const r = res.rows[0]
  if (!r) return null
  return { id: String(r.id), email: String(r.email), created_at: String(r.created_at) }
}

export async function requireUser(nextPath?: string): Promise<User> {
  const user = await currentUser()
  if (!user) {
    redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`)
  }
  return user
}
