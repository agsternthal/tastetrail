/**
 * TasteTrail database setup.
 *
 * Run:  npm run db:setup    (create tables + (re)seed stub trails)
 *       npm run db:reset    (DROP all tables, then recreate + seed)
 *       npm run places:pull (pull real venue data for both trails)
 *
 * Uses @libsql/client directly; do NOT use prisma db push against libsql://.
 * Seeding only touches trails + trail_stops; never wipes user/purchase/redemption data.
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@libsql/client'
import type { ContentBlock, Tag, BookingType } from '../src/types'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url) {
  console.error('Missing TURSO_DATABASE_URL. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

const db = createClient({ url, authToken })
const RESET = process.argv.includes('--reset')

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id          TEXT PRIMARY KEY,
     email       TEXT UNIQUE NOT NULL,
     created_at  TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS auth_tokens (
     id          TEXT PRIMARY KEY,
     email       TEXT NOT NULL,
     code_hash   TEXT NOT NULL,
     token_hash  TEXT NOT NULL,
     expires_at  TEXT NOT NULL,
     used_at     TEXT,
     created_at  TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_auth_tokens_email ON auth_tokens(email)`,
  `CREATE TABLE IF NOT EXISTS trails (
     id              TEXT PRIMARY KEY,
     region          TEXT NOT NULL,
     title           TEXT NOT NULL,
     summary         TEXT NOT NULL,
     description     TEXT NOT NULL,
     price_cents     INTEGER NOT NULL,
     currency        TEXT NOT NULL,
     duration_min    INTEGER NOT NULL,
     stop_count      INTEGER NOT NULL,
     hero_image      TEXT NOT NULL,
     included_json   TEXT NOT NULL DEFAULT '[]',
     tags_json       TEXT NOT NULL DEFAULT '[]',
     drink_types_json TEXT NOT NULL DEFAULT '[]',
     unit_system     TEXT NOT NULL DEFAULT 'imperial',
     timezone        TEXT NOT NULL DEFAULT 'America/New_York',
     best_time       TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS trail_stops (
     id                     TEXT PRIMARY KEY,
     trail_id               TEXT NOT NULL REFERENCES trails(id),
     position               INTEGER NOT NULL,
     name                   TEXT NOT NULL,
     address                TEXT NOT NULL,
     lat                    REAL NOT NULL,
     lng                    REAL NOT NULL,
     tasting                TEXT NOT NULL,
     content_json           TEXT NOT NULL DEFAULT '[]',
     note                   TEXT,
     hours_json             TEXT NOT NULL DEFAULT '[]',
     hours_periods_json     TEXT NOT NULL DEFAULT '[]',
     photo_ref              TEXT,
     map_url                TEXT,
     booking_type           TEXT NOT NULL DEFAULT 'walk_in',
     booking_url            TEXT,
     drive_time_to_next_min INTEGER,
     lunch_close_start      TEXT,
     lunch_close_end        TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_trail_stops_trail ON trail_stops(trail_id)`,
  `CREATE TABLE IF NOT EXISTS purchases (
     id               TEXT PRIMARY KEY,
     user_id          TEXT NOT NULL REFERENCES users(id),
     trail_id         TEXT NOT NULL REFERENCES trails(id),
     status           TEXT NOT NULL DEFAULT 'owned',
     payment_provider TEXT NOT NULL DEFAULT 'stub',
     payment_ref      TEXT,
     created_at       TEXT NOT NULL,
     UNIQUE(user_id, trail_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id)`,
  `CREATE TABLE IF NOT EXISTS redemptions (
     id           TEXT PRIMARY KEY,
     purchase_id  TEXT NOT NULL REFERENCES purchases(id),
     stop_id      TEXT NOT NULL REFERENCES trail_stops(id),
     redeem_token TEXT UNIQUE NOT NULL,
     status       TEXT NOT NULL DEFAULT 'unredeemed',
     visited_at   TEXT,
     redeemed_at  TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_redemptions_purchase ON redemptions(purchase_id)`,
  `CREATE INDEX IF NOT EXISTS idx_redemptions_token ON redemptions(redeem_token)`,
]

const DROP = [
  'DROP TABLE IF EXISTS redemptions',
  'DROP TABLE IF EXISTS purchases',
  'DROP TABLE IF EXISTS trail_stops',
  'DROP TABLE IF EXISTS trails',
  'DROP TABLE IF EXISTS auth_tokens',
  'DROP TABLE IF EXISTS users',
]

type SeedStop = {
  id: string
  position: number
  name: string
  address: string
  lat: number
  lng: number
  tasting: string
  content: ContentBlock[]
  note?: string | null
  hours?: string[]
  hours_periods?: unknown[]
  photo_ref?: string | null
  map_url?: string | null
  booking_type?: BookingType
  booking_url?: string | null
  drive_time_to_next_min?: number | null
  lunch_close_start?: string | null
  lunch_close_end?: string | null
}

type SeedTrail = {
  id: string
  region: string
  title: string
  summary: string
  description: string
  price_cents: number
  currency: string
  duration_min: number
  hero_image: string
  included: string[]
  tags: Tag[]
  drink_types: string[]
  unit_system?: 'imperial' | 'metric'
  timezone?: string
  best_time?: string | null
  stops: SeedStop[]
}

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`

const story = (title: string, image: string, text: string): ContentBlock[] => [
  { type: 'heading', text: title },
  { type: 'image', url: image },
  { type: 'text', text },
]

// Stub trails — real data comes from npm run places:pull (writes scripts/seed/*.json)
const STUB_TRAILS: SeedTrail[] = []

function loadSeedFile(name: string): SeedTrail | null {
  try {
    const raw = readFileSync(join(process.cwd(), 'scripts', 'seed', `${name}.json`), 'utf8')
    return JSON.parse(raw) as SeedTrail
  } catch {
    console.warn(`  (no scripts/seed/${name}.json -- run npm run places:pull to generate)`)
    return null
  }
}

async function main() {
  console.log(`Connecting to ${url}`)

  if (RESET) {
    console.log('--reset: dropping all tables')
    for (const stmt of DROP) await db.execute(stmt)
  }

  console.log('Applying schema')
  for (const stmt of SCHEMA) await db.execute(stmt)

  const senecaLake = loadSeedFile('seneca-lake')
  const burgundy = loadSeedFile('burgundy')

  const ALL: SeedTrail[] = [
    ...STUB_TRAILS,
    ...(senecaLake ? [senecaLake] : []),
    ...(burgundy ? [burgundy] : []),
  ]

  if (ALL.length === 0) {
    console.log('No seed data yet. Run npm run places:pull to generate trail fixtures.')
  } else {
    console.log('Seeding trails + stops (idempotent)')
    for (const t of ALL) {
      await db.execute({ sql: 'DELETE FROM trail_stops WHERE trail_id = ?', args: [t.id] })
      await db.execute({
        sql: `INSERT INTO trails
                (id, region, title, summary, description, price_cents, currency,
                 duration_min, stop_count, hero_image, included_json, tags_json,
                 drink_types_json, unit_system, timezone, best_time)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(id) DO UPDATE SET
                region=excluded.region, title=excluded.title, summary=excluded.summary,
                description=excluded.description, price_cents=excluded.price_cents,
                currency=excluded.currency, duration_min=excluded.duration_min,
                stop_count=excluded.stop_count, hero_image=excluded.hero_image,
                included_json=excluded.included_json, tags_json=excluded.tags_json,
                drink_types_json=excluded.drink_types_json, unit_system=excluded.unit_system,
                timezone=excluded.timezone, best_time=excluded.best_time`,
        args: [
          t.id, t.region, t.title, t.summary, t.description, t.price_cents, t.currency,
          t.duration_min, t.stops.length, t.hero_image, JSON.stringify(t.included),
          JSON.stringify(t.tags), JSON.stringify(t.drink_types),
          t.unit_system ?? 'imperial', t.timezone ?? 'America/New_York', t.best_time ?? null,
        ],
      })
      for (const s of t.stops) {
        await db.execute({
          sql: `INSERT INTO trail_stops
                  (id, trail_id, position, name, address, lat, lng, tasting, content_json,
                   note, hours_json, hours_periods_json, photo_ref, map_url,
                   booking_type, booking_url, drive_time_to_next_min,
                   lunch_close_start, lunch_close_end)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            s.id, t.id, s.position, s.name, s.address, s.lat, s.lng, s.tasting,
            JSON.stringify(s.content), s.note ?? null,
            JSON.stringify(s.hours ?? []), JSON.stringify(s.hours_periods ?? []),
            s.photo_ref ?? null, s.map_url ?? null,
            s.booking_type ?? 'walk_in', s.booking_url ?? null,
            s.drive_time_to_next_min ?? null,
            s.lunch_close_start ?? null, s.lunch_close_end ?? null,
          ],
        })
      }
      console.log(`  ${t.title} (${t.stops.length} stops)`)
    }
  }

  console.log('Database ready.')
}

main().catch((e) => {
  console.error('db-setup failed:', e)
  process.exit(1)
})
