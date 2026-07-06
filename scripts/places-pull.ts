/**
 * Google Places pull for TasteTrail seed trails.
 *
 * Uses the LEGACY Places API (Find Place From Text + Place Details).
 * WE choose which venues go in each trail and hand-write every story/tasting.
 * Google supplies the facts: name, address, coords, hours, photos.
 *
 * Run: npm run places:pull
 * Writes: scripts/seed/seneca-lake.json + scripts/seed/burgundy.json
 * Then:   npm run db:setup
 *
 * IMPORTANT: Do NOT invent any venue details, awards, or history.
 * All story text marked TODO must be filled in by the curator before going live.
 */
import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const KEY = process.env.GOOGLE_PLACES_API_KEY
if (!KEY) {
  console.error('Missing GOOGLE_PLACES_API_KEY in .env')
  process.exit(1)
}
const API = 'https://maps.googleapis.com/maps/api/place'

type Curated = {
  id: string
  position: number
  query: string
  placeId?: string
  tasting: string
  storyTitle: string
  storyText: string
  note: string
  booking_type: 'walk_in' | 'recommended' | 'required'
  booking_url?: string
  drive_time_to_next_min?: number
  lunch_close_start?: string
  lunch_close_end?: string
}

// ---------------------------------------------------------------------------
// Trail 1: Seneca Lake West Side (Finger Lakes, NY)
// Route 14 corridor, 6 stops, half-day drive.
// All story text below is placeholder (TODO) until curator fills in.
// ---------------------------------------------------------------------------

const SENECA_CENTER = { lat: 42.6099, lng: -76.9669 }

const SENECA_STOPS: Curated[] = [
  {
    id: 'stop-seneca-1',
    position: 1,
    query: 'Lakewood Vineyards Watkins Glen NY',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Lakewood Vineyards',
    storyText: 'TODO: Story about Lakewood Vineyards. Do not invent history or awards.',
    note: 'TODO: practical note (hours, walk-in vs reservation, etc.)',
    booking_type: 'walk_in',
    drive_time_to_next_min: 8,
  },
  {
    id: 'stop-seneca-2',
    position: 2,
    query: 'Castel Grisch Winery Watkins Glen NY',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Castel Grisch',
    storyText: 'TODO: Story about Castel Grisch. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'walk_in',
    drive_time_to_next_min: 10,
  },
  {
    id: 'stop-seneca-3',
    position: 3,
    query: 'Chateau Lafayette Reneau Hector NY',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Chateau Lafayette Reneau',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'recommended',
    drive_time_to_next_min: 7,
  },
  {
    id: 'stop-seneca-4',
    position: 4,
    query: 'Glenora Wine Cellars Dundee NY',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Glenora Wine Cellars',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'walk_in',
    drive_time_to_next_min: 12,
  },
  {
    id: 'stop-seneca-5',
    position: 5,
    query: 'Fulkerson Winery Dundee NY',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Fulkerson Winery',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'walk_in',
    drive_time_to_next_min: 9,
  },
  {
    id: 'stop-seneca-6',
    position: 6,
    query: 'Wagner Vineyards Estate Winery Lodi NY',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Wagner Vineyards',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'walk_in',
  },
]

// ---------------------------------------------------------------------------
// Trail 2: Route des Grands Crus - Cote de Nuits (Burgundy, France)
// Gevrey-Chambertin through Vosne-Romanee, 6 stops.
// Mix of appointment-only domaines and open caveaux.
// Lunch closure (12:00-14:00) must show on stops open mid-day.
// ---------------------------------------------------------------------------

const BURGUNDY_CENTER = { lat: 47.2209, lng: 4.9703 }

const BURGUNDY_STOPS: Curated[] = [
  {
    id: 'stop-burgundy-1',
    position: 1,
    query: 'Maison Faiveley Gevrey-Chambertin',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for stop in Gevrey-Chambertin',
    storyText: 'TODO: Story. Do not invent history, ratings, or specific vintages.',
    note: 'TODO: practical note - note if appointment required',
    booking_type: 'required',
    drive_time_to_next_min: 5,
    lunch_close_start: '12:00',
    lunch_close_end: '14:00',
  },
  {
    id: 'stop-burgundy-2',
    position: 2,
    query: 'Caveau de Morey Morey-Saint-Denis',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Morey-Saint-Denis stop',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'walk_in',
    drive_time_to_next_min: 4,
    lunch_close_start: '12:00',
    lunch_close_end: '14:00',
  },
  {
    id: 'stop-burgundy-3',
    position: 3,
    query: 'Caveau des Musigny Chambolle-Musigny',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Chambolle-Musigny stop',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'walk_in',
    drive_time_to_next_min: 6,
    lunch_close_start: '12:00',
    lunch_close_end: '14:00',
  },
  {
    id: 'stop-burgundy-4',
    position: 4,
    query: 'Chateau du Clos de Vougeot',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Clos de Vougeot',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note - landmark visit',
    booking_type: 'walk_in',
    drive_time_to_next_min: 5,
  },
  {
    id: 'stop-burgundy-5',
    position: 5,
    query: 'Domaine Confuron-Cotetidot Vosne-Romanee',
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Vosne-Romanee stop',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'required',
    drive_time_to_next_min: 4,
  },
  {
    id: 'stop-burgundy-6',
    position: 6,
    query: "Caveau Municipal de Nuits-Saint-Georges",
    tasting: 'TODO: tasting flight description',
    storyTitle: 'TODO: Story title for Nuits-Saint-Georges stop',
    storyText: 'TODO: Story. Do not invent history or awards.',
    note: 'TODO: practical note',
    booking_type: 'walk_in',
  },
]

// ---------------------------------------------------------------------------
// Google Places helpers (legacy API)
// ---------------------------------------------------------------------------

async function findPlaceId(query: string, center: { lat: number; lng: number }): Promise<string | null> {
  const params = new URLSearchParams({
    key: KEY!,
    input: query,
    inputtype: 'textquery',
    fields: 'place_id',
    locationbias: `point:${center.lat},${center.lng}`,
  })
  const r = await fetch(`${API}/findplacefromtext/json?${params}`)
  const j = await r.json()
  if (j.status === 'REQUEST_DENIED') throw new Error(`Places REQUEST_DENIED: ${j.error_message}`)
  return j?.candidates?.[0]?.place_id ?? null
}

type Details = {
  name: string
  formatted_address: string
  geometry?: { location?: { lat: number; lng: number } }
  opening_hours?: { weekday_text?: string[]; periods?: unknown[] }
  photos?: { photo_reference: string }[]
  url?: string
  rating?: number
}

async function getDetails(placeId: string): Promise<Details> {
  const fields = ['name', 'formatted_address', 'geometry', 'opening_hours', 'photos', 'url', 'rating'].join(',')
  const params = new URLSearchParams({ key: KEY!, place_id: placeId, fields })
  const r = await fetch(`${API}/details/json?${params}`)
  const j = await r.json()
  if (j.status !== 'OK') throw new Error(`Details ${j.status}: ${j.error_message ?? ''}`)
  return j.result as Details
}

async function resolve(query: string, center: { lat: number; lng: number }, placeId?: string) {
  const pid = placeId ?? (await findPlaceId(query, center))
  if (!pid) throw new Error(`No Google match for "${query}"`)
  const d = await getDetails(pid)
  const loc = d.geometry?.location
  if (!loc) throw new Error(`No coordinates for "${query}"`)
  return {
    place_id: pid,
    name: d.name,
    address: d.formatted_address,
    lat: loc.lat,
    lng: loc.lng,
    hours: d.opening_hours?.weekday_text ?? [],
    hours_periods: d.opening_hours?.periods ?? [],
    photo_ref: d.photos?.[0]?.photo_reference ?? null,
    map_url: d.url ?? null,
    rating: d.rating ?? null,
  }
}

const PHOTO = (ref: string | null, max = 800) =>
  ref ? `/api/google/photo?ref=${encodeURIComponent(ref)}&max=${max}` : null

async function pullTrail(
  trailId: string,
  stops: Curated[],
  center: { lat: number; lng: number }
) {
  const out = []
  for (const s of stops) {
    console.log(`  ${s.position}. ${s.query}...`)
    try {
      const g = await resolve(s.query, center, s.placeId)
      console.log(`     -> ${g.name} | ${g.address} | rating: ${g.rating ?? '-'}`)
      const image = PHOTO(g.photo_ref)
      out.push({
        id: s.id,
        position: s.position,
        name: g.name,
        address: g.address,
        lat: g.lat,
        lng: g.lng,
        tasting: s.tasting,
        note: s.note,
        hours: g.hours,
        hours_periods: g.hours_periods,
        photo_ref: g.photo_ref,
        map_url: g.map_url,
        booking_type: s.booking_type,
        booking_url: s.booking_url ?? null,
        drive_time_to_next_min: s.drive_time_to_next_min ?? null,
        lunch_close_start: s.lunch_close_start ?? null,
        lunch_close_end: s.lunch_close_end ?? null,
        content: [
          { type: 'heading', text: s.storyTitle },
          ...(image ? [{ type: 'image', url: image }] : []),
          { type: 'text', text: s.storyText },
        ],
      })
    } catch (e) {
      console.error(`     FAILED: ${e}`)
      out.push({
        id: s.id,
        position: s.position,
        name: s.query + ' (LOOKUP FAILED)',
        address: 'TODO: address',
        lat: center.lat,
        lng: center.lng,
        tasting: s.tasting,
        note: s.note,
        hours: [],
        hours_periods: [],
        photo_ref: null,
        map_url: null,
        booking_type: s.booking_type,
        booking_url: s.booking_url ?? null,
        drive_time_to_next_min: s.drive_time_to_next_min ?? null,
        lunch_close_start: s.lunch_close_start ?? null,
        lunch_close_end: s.lunch_close_end ?? null,
        content: [{ type: 'heading', text: s.storyTitle }, { type: 'text', text: s.storyText }],
      })
    }
    // Polite rate limit
    await new Promise((r) => setTimeout(r, 300))
  }
  return out
}

async function main() {
  const dir = join(process.cwd(), 'scripts', 'seed')
  mkdirSync(dir, { recursive: true })

  // --- Seneca Lake West Side ---
  console.log('\nSeneca Lake West Side (Finger Lakes, NY)...')
  const senecaStops = await pullTrail('trail-seneca-lake', SENECA_STOPS, SENECA_CENTER)
  const heroRefSeneca = senecaStops[0]?.photo_ref ?? null

  const senecaTrail = {
    id: 'trail-seneca-lake',
    region: 'Finger Lakes, NY',
    title: 'Seneca Lake West Side Wine Trail',
    summary: 'A half-day drive along Route 14 through some of the Finger Lakes finest Riesling and red wine country.',
    description: 'The west side of Seneca Lake is one of the most concentrated wine regions in the eastern United States. This route follows Route 14 from Watkins Glen north through six wineries, covering everything from crisp Rieslings to structured reds. Plan for a half-day with a designated driver or a rideshare plan in place.',
    price_cents: 4900,
    currency: 'USD',
    duration_min: 240,
    hero_image: PHOTO(heroRefSeneca, 1200) ?? 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=70',
    included: [
      '6 pre-paid tasting flights',
      'GPS driving route along Route 14',
      'Story and tasting notes at every stop',
      'Redeem-by-QR at each winery',
    ],
    tags: [
      { category: 'Region', label: 'Finger Lakes' },
      { category: 'DrinkType', label: 'Wine' },
      { category: 'Style', label: 'Riesling Country' },
    ],
    drink_types: ['wine'],
    unit_system: 'imperial',
    timezone: 'America/New_York',
    best_time: 'Best driven May through October. Most wineries open 10am-5pm.',
    stops: senecaStops,
  }

  writeFileSync(join(dir, 'seneca-lake.json'), JSON.stringify(senecaTrail, null, 2))
  console.log('Wrote scripts/seed/seneca-lake.json')

  // --- Route des Grands Crus, Cote de Nuits ---
  console.log('\nRoute des Grands Crus - Cote de Nuits (Burgundy, France)...')
  const burgundyStops = await pullTrail('trail-burgundy', BURGUNDY_STOPS, BURGUNDY_CENTER)
  const heroRefBurgundy = burgundyStops[0]?.photo_ref ?? null

  const burgundyTrail = {
    id: 'trail-burgundy-cote-de-nuits',
    region: 'Cote de Nuits, Burgundy',
    title: 'Route des Grands Crus - Cote de Nuits',
    summary: 'Drive the legendary wine road through Gevrey-Chambertin, Morey-Saint-Denis, Chambolle-Musigny, and Vosne-Romanee.',
    description: 'The Route des Grands Crus is the backbone of Burgundian wine. This trail runs the southern half - the Cote de Nuits - through six stops from Gevrey-Chambertin down to Nuits-Saint-Georges. A mix of appointment-only domaines and open village caveaux. Note the French lunch break: most producers close 12:00-14:00; plan your route accordingly.',
    price_cents: 8900,
    currency: 'EUR',
    duration_min: 300,
    hero_image: PHOTO(heroRefBurgundy, 1200) ?? 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=70',
    included: [
      '6 pre-paid tasting flights',
      'GPS driving route along the Route des Grands Crus',
      'Story and tasting notes at every stop',
      'Redeem-by-QR at each domaine or caveau',
    ],
    tags: [
      { category: 'Region', label: 'Burgundy' },
      { category: 'DrinkType', label: 'Wine' },
      { category: 'Style', label: 'Pinot Noir' },
      { category: 'Style', label: 'Grand Cru' },
    ],
    drink_types: ['wine'],
    unit_system: 'metric',
    timezone: 'Europe/Paris',
    best_time: 'Most domaines open by appointment only. Reserve well in advance. Avoid the lunch break (12:00-14:00).',
    stops: burgundyStops,
  }

  writeFileSync(join(dir, 'burgundy.json'), JSON.stringify(burgundyTrail, null, 2))
  console.log('Wrote scripts/seed/burgundy.json')

  console.log('\nDone. Review the TODO fields in each file, then run npm run db:setup.')
}

main().catch((e) => {
  console.error('places-pull failed:', e)
  process.exit(1)
})
