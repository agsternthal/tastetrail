import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyCode, verifyToken } from '@/lib/auth/tokens'
import { upsertUserByEmail } from '@/lib/auth/users'
import { createSession } from '@/lib/auth/session'
import { env } from '@/lib/env'

async function signIn(email: string) {
  const user = await upsertUserByEmail(email)
  await createSession({ userId: user.id, email: user.email })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') ?? ''
  const next = url.searchParams.get('next') || '/trails'

  const result = await verifyToken(token)
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/login?error=${result.reason}`, env.appUrl()))
  }

  await signIn(result.email)
  const dest = next.startsWith('/') ? next : '/trails'
  return NextResponse.redirect(new URL(dest, env.appUrl()))
}

const Body = z.object({ email: z.string().email(), code: z.string().min(4).max(8) })

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 })
  }

  const result = await verifyCode(parsed.data.email, parsed.data.code)
  if (!result.ok) {
    const msg = result.reason === 'expired' ? 'That code has expired.' : 'That code is not correct.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  await signIn(result.email)
  return NextResponse.json({ ok: true })
}
