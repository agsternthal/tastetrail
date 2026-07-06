import 'server-only'
import { getDb } from './db'

export interface RedemptionView {
  redeem_token: string
  status: 'unredeemed' | 'redeemed'
  redeemed_at: string | null
  stop_name: string
  stop_address: string
  tasting: string
  trail_title: string
  trail_region: string
  position: number
}

type Row = Record<string, unknown>

function toView(r: Row): RedemptionView {
  return {
    redeem_token: String(r.redeem_token),
    status: r.redeemed_at ? 'redeemed' : 'unredeemed',
    redeemed_at: r.redeemed_at ? String(r.redeemed_at) : null,
    stop_name: String(r.name),
    stop_address: String(r.address),
    tasting: String(r.tasting),
    trail_title: String(r.trail_title),
    trail_region: String(r.trail_region),
    position: Number(r.position),
  }
}

const SELECT = `
  SELECT r.redeem_token, r.redeemed_at,
         s.name, s.address, s.tasting, s.position,
         t.title AS trail_title, t.region AS trail_region
  FROM redemptions r
  JOIN trail_stops s ON s.id = r.stop_id
  JOIN trails t      ON t.id = s.trail_id
  WHERE r.redeem_token = ?`

export async function getRedemptionByToken(token: string): Promise<RedemptionView | null> {
  const db = getDb()
  const res = await db.execute({ sql: SELECT, args: [token] })
  return res.rows[0] ? toView(res.rows[0] as Row) : null
}

export type RedeemOutcome =
  | { result: 'redeemed'; view: RedemptionView }
  | { result: 'already'; view: RedemptionView }
  | { result: 'not_found' }

export async function redeemByToken(token: string): Promise<RedeemOutcome> {
  const db = getDb()
  const now = new Date().toISOString()

  const upd = await db.execute({
    sql: `UPDATE redemptions
          SET redeemed_at = ?, status = 'redeemed'
          WHERE redeem_token = ? AND redeemed_at IS NULL`,
    args: [now, token],
  })

  const view = await getRedemptionByToken(token)
  if (!view) return { result: 'not_found' }

  return upd.rowsAffected === 1
    ? { result: 'redeemed', view }
    : { result: 'already', view }
}
