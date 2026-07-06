import { NextResponse } from 'next/server'
import { z } from 'zod'
import { currentUser } from '@/lib/auth/currentUser'
import { markVisited } from '@/lib/trails'

const Body = z.object({ redemptionId: z.string().min(1) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Missing redemptionId' }, { status: 400 })

  await markVisited(user.id, parsed.data.redemptionId)
  return NextResponse.json({ ok: true })
}
