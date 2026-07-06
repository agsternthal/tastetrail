import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createChallenge } from '@/lib/auth/tokens'
import { sendLoginEmail } from '@/lib/auth/email'
import { env } from '@/lib/env'

const Body = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  const email = parsed.data.email.trim().toLowerCase()

  try {
    const { code, token } = await createChallenge(email)
    const magicLink = `${env.appUrl()}/api/auth/verify?token=${token}`
    await sendLoginEmail({ to: email, code, magicLink })
  } catch (e) {
    console.error('auth/request failed:', e)
    return NextResponse.json(
      { error: 'Could not send the email. Check RESEND_API_KEY / AUTH_EMAIL_FROM.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
