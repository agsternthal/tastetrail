import { NextRequest } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FALLBACK =
  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=70'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  const max = req.nextUrl.searchParams.get('max') || '800'
  const key = env.googlePlacesKey()

  if (!ref || !key) return Response.redirect(FALLBACK, 302)

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?photoreference=${encodeURIComponent(ref)}&maxwidth=${encodeURIComponent(max)}&key=${key}`
    const upstream = await fetch(url, { redirect: 'follow' })
    if (!upstream.ok || !upstream.body) return Response.redirect(FALLBACK, 302)

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
      },
    })
  } catch {
    return Response.redirect(FALLBACK, 302)
  }
}
