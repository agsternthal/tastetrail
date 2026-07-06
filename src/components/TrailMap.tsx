'use client'

import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import Map, { Marker, Source, Layer, type MapRef, type ViewState } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export interface MapStop {
  id: string
  position: number
  name: string
  lat: number
  lng: number
  visited: boolean
  redeemed: boolean
}

interface Props {
  token: string
  stops: MapStop[]
  userLocation: { lat: number; lng: number } | null
  activeStopId: string | null
  onStopClick?: (id: string) => void
  resizeSignal?: unknown
}

const routeLayer = {
  id: 'trail-route',
  type: 'line' as const,
  source: 'trail-route',
  layout: { 'line-join': 'round' as const, 'line-cap': 'round' as const },
  paint: {
    'line-color': '#722F37',
    'line-width': 4,
    'line-dasharray': [1, 1.5],
    'line-opacity': 0.8,
  },
}

export default function TrailMap({
  token,
  stops,
  userLocation,
  activeStopId,
  onStopClick,
  resizeSignal,
}: Props) {
  const mapRef = useRef<MapRef>(null)
  const ordered = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops])

  const [viewport, setViewport] = useState<ViewState>({
    longitude: ordered[0]?.lng ?? 0,
    latitude: ordered[0]?.lat ?? 20,
    zoom: 11,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  })

  const routeGeoJSON = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: ordered.map((s) => [s.lng, s.lat]),
      },
    }),
    [ordered]
  )

  const fitAll = useCallback(() => {
    if (!mapRef.current || ordered.length === 0) return
    const pts = ordered.map((s) => ({ lng: s.lng, lat: s.lat }))
    if (userLocation) pts.push(userLocation)
    const lngs = pts.map((p) => p.lng)
    const lats = pts.map((p) => p.lat)
    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 64, duration: 800, maxZoom: 14 }
    )
  }, [ordered, userLocation])

  useEffect(() => {
    if (!mapRef.current || !activeStopId) return
    const s = ordered.find((x) => x.id === activeStopId)
    if (s) mapRef.current.easeTo({ center: [s.lng, s.lat], zoom: 13, duration: 700 })
  }, [activeStopId, ordered])

  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.resize()
      fitAll()
    }, 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeSignal])

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-100 p-6 text-center text-sm text-stone-500">
        Map unavailable - set{' '}
        <code className="mx-1 rounded bg-stone-200 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> to see
        the trail map.
      </div>
    )
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={token}
      {...viewport}
      onMove={(e) => setViewport(e.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
      onLoad={fitAll}
    >
      <Source id="trail-route" type="geojson" data={routeGeoJSON}>
        <Layer {...routeLayer} />
      </Source>

      {ordered.map((s) => {
        const active = s.id === activeStopId
        const color = s.redeemed
          ? 'bg-green-600'
          : active
            ? 'bg-brand ring-4 ring-brand/30'
            : s.visited
              ? 'bg-stone-500'
              : 'bg-white text-stone-800 border-2 border-brand'
        const textColor = s.redeemed || active || s.visited ? 'text-white' : 'text-brand'
        return (
          <Marker
            key={s.id}
            longitude={s.lng}
            latitude={s.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onStopClick?.(s.id)
            }}
          >
            <div
              className={`flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full text-sm font-bold shadow-md transition-transform ${color} ${textColor} ${
                active ? 'scale-125' : ''
              }`}
            >
              {s.redeemed ? '✓' : s.position}
            </div>
          </Marker>
        )
      })}

      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow" />
          </span>
        </Marker>
      )}
    </Map>
  )
}
