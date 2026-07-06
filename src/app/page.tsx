import Link from 'next/link'
import { currentUser } from '@/lib/auth/currentUser'
import AgeGate from '@/components/AgeGate'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await currentUser()

  return (
    <>
      <AgeGate />
      <main className="min-h-screen">
        <section className="relative">
          <div
            className="h-72 w-full bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=70)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 p-6 text-white">
            <div className="text-sm font-semibold uppercase tracking-wider text-brand-light">
              TasteTrail
            </div>
            <h1 className="mt-1 text-3xl font-bold leading-tight">
              Drive the trail. Taste every stop.
            </h1>
          </div>
        </section>

        <section className="p-6">
          <p className="text-stone-600">
            Self-guided driven trails through wine, spirits, and beer country. Pre-paid tasting
            flights redeemed by QR at every stop.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/trails"
              className="block rounded-xl bg-brand px-5 py-3.5 text-center font-semibold text-white shadow-sm active:scale-[.99]"
            >
              Browse trails
            </Link>
            {user ? (
              <Link
                href="/account"
                className="block rounded-xl border border-stone-300 px-5 py-3.5 text-center font-semibold text-stone-700"
              >
                My trails ({user.email})
              </Link>
            ) : (
              <Link
                href="/login"
                className="block rounded-xl border border-stone-300 px-5 py-3.5 text-center font-semibold text-stone-700"
              >
                Sign in
              </Link>
            )}
          </div>

          <ul className="mt-8 space-y-3 text-sm text-stone-600">
            <li>🍷 Curated stops chosen by locals who know the region</li>
            <li>🗺️ GPS driving route - where you are on the trail at a glance</li>
            <li>🎟️ Pre-paid tasting flights redeemed by QR at each stop</li>
          </ul>

          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Please drink responsibly. Have a designated driver before you start.
          </div>
        </section>
      </main>
    </>
  )
}
