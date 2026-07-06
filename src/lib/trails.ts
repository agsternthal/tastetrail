import 'server-only'
import { getDb } from './db'
import type {
  Trail,
  TrailStop,
  StopProgress,
  Purchase,
  Tag,
  ContentBlock,
  OpeningPeriod,
  BookingType,
} from '@/types'

type Row = Record<string, unknown>

function safeParseArray(v: unknown): unknown[] {
  try {
    const parsed = JSON.parse(String(v))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toTrail(r: Row): Trail {
  return {
    id: String(r.id),
    region: String(r.region),
    title: String(r.title),
    summary: String(r.summary),
    description: String(r.description),
    price_cents: Number(r.price_cents),
    currency: String(r.currency),
    duration_min: Number(r.duration_min),
    stop_count: Number(r.stop_count),
    hero_image: String(r.hero_image),
    included: safeParseArray(r.included_json).map(String),
    tags: safeParseArray(r.tags_json) as Tag[],
    drink_types: safeParseArray(r.drink_types_json).map(String),
    unit_system: (r.unit_system === 'metric' ? 'metric' : 'imperial') as 'imperial' | 'metric',
    timezone: String(r.timezone ?? 'America/New_York'),
    best_time: r.best_time ? String(r.best_time) : null,
  }
}

function toStop(r: Row): TrailStop {
  return {
    id: String(r.id),
    trail_id: String(r.trail_id),
    position: Number(r.position),
    name: String(r.name),
    address: String(r.address),
    lat: Number(r.lat),
    lng: Number(r.lng),
    tasting: String(r.tasting),
    content: safeParseArray(r.content_json) as ContentBlock[],
    note: r.note ? String(r.note) : null,
    hours: safeParseArray(r.hours_json).map(String),
    hours_periods: safeParseArray(r.hours_periods_json) as OpeningPeriod[],
    photo_ref: r.photo_ref ? String(r.photo_ref) : null,
    map_url: r.map_url ? String(r.map_url) : null,
    booking_type: (r.booking_type as BookingType) ?? 'walk_in',
    booking_url: r.booking_url ? String(r.booking_url) : null,
    drive_time_to_next_min: r.drive_time_to_next_min ? Number(r.drive_time_to_next_min) : null,
    lunch_close_start: r.lunch_close_start ? String(r.lunch_close_start) : null,
    lunch_close_end: r.lunch_close_end ? String(r.lunch_close_end) : null,
  }
}

export async function getTrails(): Promise<Trail[]> {
  const db = getDb()
  const res = await db.execute('SELECT * FROM trails ORDER BY region, title')
  return res.rows.map((r) => toTrail(r as Row))
}

export async function getTrail(id: string): Promise<Trail | null> {
  const db = getDb()
  const res = await db.execute({ sql: 'SELECT * FROM trails WHERE id = ?', args: [id] })
  return res.rows[0] ? toTrail(res.rows[0] as Row) : null
}

export async function getStops(trailId: string): Promise<TrailStop[]> {
  const db = getDb()
  const res = await db.execute({
    sql: 'SELECT * FROM trail_stops WHERE trail_id = ? ORDER BY position',
    args: [trailId],
  })
  return res.rows.map((r) => toStop(r as Row))
}

export async function getPurchase(userId: string, trailId: string): Promise<Purchase | null> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT * FROM purchases WHERE user_id = ? AND trail_id = ? AND status = 'owned'`,
    args: [userId, trailId],
  })
  const r = res.rows[0] as Row | undefined
  if (!r) return null
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    trail_id: String(r.trail_id),
    status: 'owned',
    payment_provider: String(r.payment_provider),
    payment_ref: r.payment_ref ? String(r.payment_ref) : null,
    created_at: String(r.created_at),
  }
}

export async function getOwnedTrails(userId: string): Promise<Trail[]> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT t.* FROM trails t
          JOIN purchases p ON p.trail_id = t.id
          WHERE p.user_id = ? AND p.status = 'owned'
          ORDER BY p.created_at DESC`,
    args: [userId],
  })
  return res.rows.map((r) => toTrail(r as Row))
}

export async function getStopsWithProgress(
  userId: string,
  trailId: string
): Promise<StopProgress[]> {
  const db = getDb()
  const res = await db.execute({
    sql: `SELECT s.*, r.id AS redemption_id, r.redeem_token, r.visited_at, r.redeemed_at
          FROM trail_stops s
          JOIN purchases p   ON p.trail_id = s.trail_id AND p.user_id = ? AND p.status = 'owned'
          JOIN redemptions r ON r.stop_id = s.id AND r.purchase_id = p.id
          WHERE s.trail_id = ?
          ORDER BY s.position`,
    args: [userId, trailId],
  })
  return res.rows.map((raw) => {
    const r = raw as Row
    return {
      ...toStop(r),
      redemption_id: String(r.redemption_id),
      redeem_token: String(r.redeem_token),
      visited_at: r.visited_at ? String(r.visited_at) : null,
      redeemed_at: r.redeemed_at ? String(r.redeemed_at) : null,
    }
  })
}

export async function markVisited(userId: string, redemptionId: string): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `UPDATE redemptions
          SET visited_at = COALESCE(visited_at, ?)
          WHERE id = ?
            AND purchase_id IN (SELECT id FROM purchases WHERE user_id = ?)`,
    args: [new Date().toISOString(), redemptionId, userId],
  })
}
