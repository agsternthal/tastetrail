import 'server-only'
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto'
import { getDb } from '../db'

const TTL_MS = 10 * 60 * 1000 // 10 minutes

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex')
}

export interface Challenge {
  code: string
  token: string
}

export async function createChallenge(email: string): Promise<Challenge> {
  const db = getDb()
  const normalized = email.trim().toLowerCase()

  await db.execute({
    sql: 'DELETE FROM auth_tokens WHERE email = ? AND used_at IS NULL',
    args: [normalized],
  })

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const token = randomBytes(32).toString('hex')
  const now = Date.now()

  await db.execute({
    sql: `INSERT INTO auth_tokens (id, email, code_hash, token_hash, expires_at, used_at, created_at)
          VALUES (?,?,?,?,?,NULL,?)`,
    args: [
      randomUUID(),
      normalized,
      sha256(`${normalized}:${code}`),
      sha256(token),
      new Date(now + TTL_MS).toISOString(),
      new Date(now).toISOString(),
    ],
  })

  return { code, token }
}

type VerifyResult = { ok: true; email: string } | { ok: false; reason: 'invalid' | 'expired' }

export async function verifyCode(email: string, code: string): Promise<VerifyResult> {
  const db = getDb()
  const normalized = email.trim().toLowerCase()
  const clean = code.replace(/\D/g, '')
  if (clean.length !== 6) return { ok: false, reason: 'invalid' }

  const res = await db.execute({
    sql: `SELECT * FROM auth_tokens
          WHERE email = ? AND code_hash = ? AND used_at IS NULL
          ORDER BY created_at DESC LIMIT 1`,
    args: [normalized, sha256(`${normalized}:${clean}`)],
  })
  const row = res.rows[0]
  if (!row) return { ok: false, reason: 'invalid' }
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' }
  }
  await markUsed(String(row.id))
  return { ok: true, email: normalized }
}

export async function verifyToken(token: string): Promise<VerifyResult> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT * FROM auth_tokens
          WHERE token_hash = ? AND used_at IS NULL
          ORDER BY created_at DESC LIMIT 1`,
    args: [sha256(token)],
  })
  const row = res.rows[0]
  if (!row) return { ok: false, reason: 'invalid' }
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' }
  }
  await markUsed(String(row.id))
  return { ok: true, email: String(row.email) }
}

async function markUsed(id: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: 'UPDATE auth_tokens SET used_at = ? WHERE id = ?',
    args: [new Date().toISOString(), id],
  })
}
