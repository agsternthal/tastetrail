import { NextResponse } from 'next/server'
import { z } from 'zod'
import { currentUser } from '@/lib/auth/currentUser'
import { purchaseTrail } from '@/lib/payments'
import { getTrail } from '@/lib/trails'

const Body = z.object({ trailId: z.string().min(1) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Missing trailId' }, { status: 400 })

  const trail = await getTrail(parsed.data.trailId)
  if (!trail) return NextResponse.json({ error: 'Trail not found' }, { status: 404 })

  const result = await purchaseTrail(user.id, trail.id)
  return NextResponse.json(result)
}
