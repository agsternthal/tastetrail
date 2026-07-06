import Link from 'next/link'
import type { Trail } from '@/types'
import { formatPrice, formatDuration } from '@/lib/format'

export default function TrailCard({ trail, owned }: { trail: Trail; owned?: boolean }) {
  return (
    <Link
      href={`/trails/${trail.id}`}
      className="block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm active:scale-[.99]"
    >
      <div className="relative h-40 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={trail.hero_image} alt={trail.title} className="h-40 w-full object-cover" />
        {owned && (
          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">
            Owned
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
          {trail.drink_types.join(' / ')}
        </span>
      </div>
      <div className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-brand">
          {trail.region}
        </div>
        <h3 className="mt-1 font-bold leading-snug">{trail.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone-600">{trail.summary}</p>
        <div className="mt-3 flex items-center gap-3 text-sm text-stone-500">
          <span>🍷 {trail.stop_count} stops</span>
          <span>⏱️ {formatDuration(trail.duration_min)}</span>
          <span className="ml-auto font-bold text-stone-900">
            {formatPrice(trail.price_cents, trail.currency)}
          </span>
        </div>
      </div>
    </Link>
  )
}
