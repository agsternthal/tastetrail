import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth/currentUser'
import { getOwnedTrails } from '@/lib/trails'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await currentUser()
  if (!user) redirect('/login?next=/account')

  const trails = await getOwnedTrails(user.id)

  return (
    <main className="min-h-screen p-5">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">My trails</h1>
        <p className="text-sm text-stone-500">{user.email}</p>
      </header>

      {trails.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          No trails yet.{' '}
          <Link href="/trails" className="text-brand underline">
            Browse trails
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {trails.map((t) => (
            <Link
              key={t.id}
              href={`/trails/${t.id}`}
              className="block rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="font-semibold">{t.title}</div>
              <div className="mt-0.5 text-sm text-stone-500">{t.region}</div>
            </Link>
          ))}
        </div>
      )}

      <form action="/api/auth/logout" method="POST" className="mt-8">
        <button
          type="submit"
          className="w-full rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-600"
        >
          Sign out
        </button>
      </form>
    </main>
  )
}
