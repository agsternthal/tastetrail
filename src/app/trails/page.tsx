import { getTrails, getOwnedTrails } from '@/lib/trails'
import { currentUser } from '@/lib/auth/currentUser'
import TrailsBrowser from '@/components/TrailsBrowser'

export const dynamic = 'force-dynamic'

export default async function TrailsPage() {
  const [trails, user] = await Promise.all([getTrails(), currentUser()])
  const owned = user ? await getOwnedTrails(user.id) : []
  const ownedIds = owned.map((t) => t.id)

  return (
    <main className="min-h-screen p-5">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Trails</h1>
        <p className="text-stone-600">Drive the region. Taste every stop.</p>
      </header>

      {trails.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No trails yet. Run{' '}
          <code className="rounded bg-stone-100 px-1">npm run db:setup</code> to seed.
        </div>
      ) : (
        <TrailsBrowser trails={trails} ownedIds={ownedIds} />
      )}
    </main>
  )
}
