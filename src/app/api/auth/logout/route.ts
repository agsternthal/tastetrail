import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'
import { env } from '@/lib/env'

export async function POST() {
  destroySession()
  return NextResponse.redirect(new URL('/', env.appUrl()), { status: 303 })
}
