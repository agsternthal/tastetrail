import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTrail, getStops, getPurchase } from '@/lib/trails'
import { currentUser } from '@/lib/auth/currentUser'
import { formatPrice, formatDuration, bookingLabel } from '@/lib/format'
import BuyButton from '@/components/BuyButton'

export const dynamic = 'force-dynamic'

const BOOKING_BADGE: Record<string, string> = {
  required: 'bg-red-100 text-red-700',
  recommended: 'bg-amber-100 text-amber-700',
  walk_in: 'bg-green-100 text-green-700',
}

export default async function TrailDetail({ params }: { params: { id: string } }) {
  const trail = await getTrail(params.id)
  if (!trail) notFound()

  const [stops, user] = await Promise.all([getStops(trail.id), currentUser()])
  const purchase = user ? await getPurchase(user.id, trail.id) : null
  const owned = !!purchase
  const priceLabel = formatPrice(trail.price_cents, trail.currency)

  return (
    <main className="min-h-screen pb-32">
      <div className="relative h-56 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={trail.hero_image} alt={trail.title} className="h-56 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Link
          href="/trails"
          className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white"
        >
          Trails
        </Link>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-light">
            {trail.region}
          </div>
          <h1 className="text-2xl font-bold leading-tight">{trail.title}</h1>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4 text-sm text-stone-600">
          <span>🍷 {trail.stop_count} stops</span>
          <span>⏱️ {formatDuration(trail.duration_min)}</span>
          <span className="ml-auto text-lg font-bold text-stone-900">{priceLabel}</span>
        </div>

        <p className="mt-4 text-stone-700">{trail.description}</p>

        {trail.best_time && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span>🕒</span>
            <span>{trail.best_time}</span>
          </div>
        )}

        {trail.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {trail.tags.map((tag) => (
              <span
                key={`${tag.category}:${tag.label}`}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
                title={tag.category}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <h2 className="mt-7 text-sm font-semibold uppercase tracking-wide text-stone-500">
          What&apos;s included
        </h2>
        <ul className="mt-2 space-y-1.5">
          {trail.included.map((item) => (
            <li key={item} className="flex gap-2 text-stone-700">
              <span className="text-brand">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <h2 className="mt-7 text-sm font-semibold uppercase tracking-wide text-stone-500">
          The stops
        </h2>
        <ol className="mt-3 space-y-3">
          {stops.map((s, i) => (
            <li key={s.id} className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {s.position}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  {owned ? s.name : `Stop ${s.position}`}
                </div>
                <div className="text-sm text-stone-600">{s.tasting}</div>
                {owned ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <div className="text-xs text-stone-400">{s.address}</div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        BOOKING_BADGE[s.booking_type] ?? BOOKING_BADGE.walk_in
                      }`}
                    >
                      {bookingLabel(s.booking_type)}
                    </span>
                    {s.booking_type === 'required' && s.booking_url && (
                      <a
                        href={s.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-brand underline"
                      >
                        Book ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-stone-400">
                    Location revealed after purchase
                  </div>
                )}
                {i < stops.length - 1 && s.drive_time_to_next_min && (
                  <div className="mt-1 text-xs text-stone-400">
                    ~{s.drive_time_to_next_min} min drive to next stop
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white p-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-[480px]">
          {owned ? (
            <Link
              href={`/trails/${trail.id}/follow`}
              className="block w-full rounded-xl bg-brand px-5 py-4 text-center font-semibold text-white shadow-sm active:scale-[.99]"
            >
              Start trail
            </Link>
          ) : (
            <BuyButton trailId={trail.id} isAuthed={!!user} priceLabel={priceLabel} />
          )}
        </div>
      </div>
    </main>
  )
}
