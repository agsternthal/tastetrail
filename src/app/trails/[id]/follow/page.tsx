import { notFound, redirect } from 'next/navigation'
import { getTrail, getStopsWithProgress } from '@/lib/trails'
import { requireUser } from '@/lib/auth/currentUser'
import { publicEnv } from '@/lib/env'
import Follow from '@/components/Follow'

export const dynamic = 'force-dynamic'

export default async function FollowPage({ params }: { params: { id: string } }) {
  const user = await requireUser(`/trails/${params.id}`)
  const trail = await getTrail(params.id)
  if (!trail) notFound()

  const stops = await getStopsWithProgress(user.id, trail.id)
  if (stops.length === 0) {
    redirect(`/trails/${trail.id}`)
  }

  return (
    <Follow
      trail={trail}
      stops={stops}
      appUrl={publicEnv.appUrl}
      mapboxToken={publicEnv.mapboxToken}
    />
  )
}
