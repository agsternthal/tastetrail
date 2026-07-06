import { NextResponse } from 'next/server'
import { z } from 'zod'
import { redeemByToken } from '@/lib/redeem'

const Body = z.object({ token: z.string().min(1) })

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const outcome = await redeemByToken(parsed.data.token)
  if (outcome.result === 'not_found') {
    return NextResponse.json({ error: 'Unknown tasting code.' }, { status: 404 })
  }
  return NextResponse.json(outcome)
}
