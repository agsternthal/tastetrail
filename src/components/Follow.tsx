'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import TrailMap, { type MapStop } from './TrailMap'
import StopContent from './StopContent'
import { haversineMeters, formatDistance } from '@/lib/geo'
import { isOpenNow, todayHours, isLunchClosed } from '@/lib/hours'
import { bookingLabel } from '@/lib/format'
import type { StopProgress, Trail } from '@/types'

type GeoState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ok'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string }

type Driver = 'driver' | 'passenger' | 'solo' | null

export default function Follow({
  trail,
  stops,
  appUrl,
  mapboxToken,
}: {
  trail: Trail
  stops: StopProgress[]
  appUrl: string
  mapboxToken: string
}) {
  const router = useRouter()
  const ordered = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops])

  const firstUnredeemed = ordered.find((s) => !s.redeemed_at) ?? ordered[0]
  const [activeStopId, setActiveStopId] = useState<string>(firstUnredeemed?.id ?? '')
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' })
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [visitedBusy, setVisitedBusy] = useState(false)
  const [localVisited, setLocalVisited] = useState<Set<string>>(new Set())
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [driver, setDriver] = useState<Driver>(null)

  const active = ordered.find((s) => s.id === activeStopId) ?? ordered[0]
  const activeIndex = ordered.findIndex((s) => s.id === active.id)
  const isVisited = (s: StopProgress) => !!s.visited_at || localVisited.has(s.id)
  const redeemedCount = ordered.filter((s) => s.redeemed_at).length
  const visitedCount = ordered.filter((s) => isVisited(s) || s.redeemed_at).length
  const allRedeemed = redeemedCount === ordered.length && ordered.length > 0

  const isMetric = trail.unit_system === 'metric'

  const goTo = (i: number) => {
    const s = ordered[i]
    if (s) { setActiveStopId(s.id); setMapFullscreen(false) }
  }

  const directionsUrl = (s: StopProgress) =>
    `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=driving`

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeo({ status: 'error', message: 'This device has no location support.' })
      return
    }
    setGeo({ status: 'locating' })
    const id = navigator.geolocation.watchPosition(
      (pos) => setGeo({ status: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location is blocked. Allow location for this site (GPS requires HTTPS).'
            : 'Could not get your location. Tap a stop to navigate.'
        setGeo({ status: 'error', message })
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  const userLoc = useMemo(
    () => (geo.status === 'ok' ? { lat: geo.lat, lng: geo.lng } : null),
    [geo]
  )

  const distanceToActive = useMemo(() => {
    if (!userLoc || !active) return null
    return haversineMeters(userLoc, { lat: active.lat, lng: active.lng })
  }, [userLoc, active])

  const mapStops: MapStop[] = ordered.map((s) => ({
    id: s.id,
    position: s.position,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    visited: !!s.visited_at,
    redeemed: !!s.redeemed_at,
  }))

  const markVisited = useCallback(async () => {
    if (!active || active.visited_at || localVisited.has(active.id)) return
    setLocalVisited((prev) => new Set(prev).add(active.id))
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(25)
    setVisitedBusy(true)
    try {
      await fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId: active.redemption_id }),
      })
      router.refresh()
    } catch { /* optimistic; server reconciles on next refresh */ }
    finally { setVisitedBusy(false) }
  }, [active, router, localVisited])

  if (!active) {
    return <div className="p-6 text-stone-500">This trail has no stops.</div>
  }

  // Driver prompt on first load
  if (driver === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
          <div className="text-3xl">🚗</div>
          <h2 className="mt-3 text-xl font-bold">Who&apos;s driving today?</h2>
          <p className="mt-1 text-sm text-stone-600">
            Please drive sober. Designate a driver before the tastings start.
          </p>
          <div className="mt-5 space-y-2">
            <button
              onClick={() => setDriver('driver')}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700"
            >
              I am the designated driver (not tasting)
            </button>
            <button
              onClick={() => setDriver('passenger')}
              className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
            >
              I&apos;m a passenger - someone else is driving
            </button>
            <button
              onClick={() => setDriver('solo')}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700"
            >
              Visiting solo (tasting only - no driving)
            </button>
          </div>
          <p className="mt-4 text-xs text-stone-400">
            Never drink and drive. Have a plan before you go.
          </p>
        </div>
      </div>
    )
  }

  const lunchWarning =
    active.lunch_close_start &&
    active.lunch_close_end &&
    isLunchClosed(active.lunch_close_start, active.lunch_close_end)

  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      {/* Header */}
      <header className="z-20 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
        <Link href={`/trails/${trail.id}`} className="text-stone-500">
          X
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{trail.title}</div>
          <div className="text-xs text-stone-500">
            {redeemedCount}/{ordered.length} tastings redeemed · {visitedCount}/{ordered.length} visited
            {driver === 'driver' && ' · DD mode'}
          </div>
        </div>
        <button
          onClick={() => router.refresh()}
          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-500"
        >
          Refresh
        </button>
      </header>

      {/* Progress bar */}
      <div className="h-1 w-full bg-stone-100">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${(redeemedCount / ordered.length) * 100}%` }}
        />
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <TrailMap
          token={mapboxToken}
          stops={mapStops}
          userLocation={userLoc}
          activeStopId={activeStopId}
          resizeSignal={mapFullscreen}
          onStopClick={(id) => { setActiveStopId(id); setMapFullscreen(false) }}
        />
        <button
          onClick={() => setMapFullscreen((v) => !v)}
          className="absolute right-3 top-3 z-10 rounded-lg bg-white/95 px-2.5 py-1.5 text-base shadow"
        >
          {mapFullscreen ? 'Collapse' : 'Expand'}
        </button>
        {geo.status === 'error' && (
          <div className="absolute inset-x-3 top-14 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
            {geo.message}
          </div>
        )}
        {allRedeemed && (
          <div className="absolute inset-x-3 top-14 rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow">
            Trail complete - you redeemed every tasting!
          </div>
        )}
        {mapFullscreen && (
          <button
            onClick={() => setMapFullscreen(false)}
            className="absolute inset-x-0 bottom-4 mx-auto w-max rounded-full bg-stone-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            Stop details
          </button>
        )}
      </div>

      {!mapFullscreen && (
        <>
          {/* Stop pager */}
          <div className="flex items-center gap-1.5 border-t border-stone-200 bg-white px-3 py-2">
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex <= 0}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg text-stone-500 disabled:opacity-30"
            >
              {'<'}
            </button>
            <div className="flex flex-1 gap-1.5 overflow-x-auto">
              {ordered.map((s) => {
                const color = s.id === activeStopId
                  ? 'bg-brand text-white'
                  : s.redeemed_at
                    ? 'bg-green-100 text-green-700'
                    : isVisited(s)
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-stone-600'
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStopId(s.id)}
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ${color}`}
                  >
                    {s.redeemed_at ? '✓' : s.position}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex >= ordered.length - 1}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg text-stone-500 disabled:opacity-30"
            >
              {'>'}
            </button>
          </div>

          {/* Active stop sheet */}
          <div
            className="max-h-[45vh] overflow-y-auto border-t border-stone-200 bg-white p-4"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-brand">
                  Stop {active.position} of {ordered.length}
                </div>
                <h2 className="text-lg font-bold leading-tight">{active.name}</h2>
                <p className="text-sm text-stone-500">{active.address}</p>

                {/* Booking badge */}
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  active.booking_type === 'required'
                    ? 'bg-red-100 text-red-700'
                    : active.booking_type === 'recommended'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                }`}>
                  {bookingLabel(active.booking_type)}
                </span>

                {/* Hours */}
                {(() => {
                  const open = isOpenNow(active.hours_periods)
                  const hrs = todayHours(active.hours)
                  return (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {open !== null && (
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {open ? 'Open now' : 'Closed now'}
                        </span>
                      )}
                      {hrs && <span className="text-stone-500">Today: {hrs}</span>}
                      {lunchWarning && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                          Lunch closure {active.lunch_close_start}-{active.lunch_close_end}
                        </span>
                      )}
                    </div>
                  )
                })()}

                <a
                  href={directionsUrl(active)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand"
                >
                  Driving directions
                </a>
              </div>

              {distanceToActive != null && (
                <a
                  href={directionsUrl(active)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none rounded-lg bg-stone-100 px-3 py-1.5 text-center active:bg-stone-200"
                >
                  <div className="text-sm font-bold text-stone-800">
                    {formatDistance(distanceToActive, isMetric)}
                  </div>
                  <div className="text-[10px] text-stone-500">from here</div>
                </a>
              )}
            </div>

            <div className="mt-3">
              <StopContent blocks={active.content} />
            </div>

            <div className="mt-4 rounded-xl bg-brand/5 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-brand">
                Your tasting flight
              </div>
              <p className="text-sm text-stone-700">{active.tasting}</p>
            </div>

            {active.note && (
              <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
                {active.note}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={markVisited}
                disabled={isVisited(active) || visitedBusy}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  isVisited(active)
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-stone-300 text-stone-700'
                }`}
              >
                {isVisited(active) ? 'Visited' : "I'm here"}
              </button>
              {active.redeemed_at ? (
                <button disabled className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white opacity-90">
                  Redeemed
                </button>
              ) : (
                <button
                  onClick={() => setQrToken(active.redeem_token)}
                  className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
                >
                  Redeem flight
                </button>
              )}
            </div>

            {activeIndex < ordered.length - 1 && (
              <button
                onClick={() => goTo(activeIndex + 1)}
                className="mt-3 w-full truncate rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-600"
              >
                Next stop: {ordered[activeIndex + 1].name}
                {ordered[activeIndex].drive_time_to_next_min
                  ? ` (~${ordered[activeIndex].drive_time_to_next_min} min)`
                  : ''}
              </button>
            )}
          </div>
        </>
      )}

      {qrToken && (
        <RedeemQR
          token={qrToken}
          appUrl={appUrl}
          stopName={active.name}
          tasting={active.tasting}
          onClose={() => { setQrToken(null); router.refresh() }}
        />
      )}
    </div>
  )
}

function RedeemQR({
  token,
  appUrl,
  stopName,
  tasting,
  onClose,
}: {
  token: string
  appUrl: string
  stopName: string
  tasting: string
  onClose: () => void
}) {
  const redeemUrl = `${appUrl}/redeem/${token}`
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-brand">
          Show this at {stopName}
        </div>
        <h3 className="mt-1 font-bold">Redeem tasting flight</h3>
        <p className="mt-1 text-sm text-stone-600">{tasting}</p>
        <div className="mt-4 flex justify-center">
          <div className="rounded-xl border border-stone-200 p-3">
            <QRCodeSVG value={redeemUrl} size={220} level="M" />
          </div>
        </div>
        <p className="mt-4 text-sm text-stone-500">
          The venue scans this QR to mark your flight redeemed. One-time use.
        </p>
        <a
          href={redeemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-xs text-stone-400 underline"
        >
          (Demo: open the venue redeem screen)
        </a>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 font-semibold text-stone-700"
        >
          Done
        </button>
      </div>
    </div>
  )
}
