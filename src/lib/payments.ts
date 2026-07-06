/**
 * PAYMENT SEAM — the only place payment happens.
 *
 * Today purchaseTrail() FAKES a successful payment (no charge). To go live with
 * Stripe: create a Checkout Session here, and call grantTrail() from the Stripe
 * webhook after checkout.session.completed. Nothing downstream changes.
 */
import 'server-only'
import { randomUUID } from 'crypto'
import { getDb } from './db'
import { getStops, getPurchase } from './trails'

export type PurchaseResult = {
  ok: true
  purchaseId: string
  alreadyOwned: boolean
}

export async function purchaseTrail(userId: string, trailId: string): Promise<PurchaseResult> {
  const existing = await getPurchase(userId, trailId)
  if (existing) return { ok: true, purchaseId: existing.id, alreadyOwned: true }

  // --- STRIPE SEAM -------------------------------------------------------
  // Real version: create a Checkout Session, redirect, and only call
  // grantTrail() from the webhook. For now we grant immediately.
  const purchaseId = await grantTrail(userId, trailId, { provider: 'stub', ref: null })
  // -----------------------------------------------------------------------

  return { ok: true, purchaseId, alreadyOwned: false }
}

export async function grantTrail(
  userId: string,
  trailId: string,
  payment: { provider: string; ref: string | null }
): Promise<string> {
  const db = getDb()

  const existing = await getPurchase(userId, trailId)
  if (existing) return existing.id

  const stops = await getStops(trailId)
  if (stops.length === 0) {
    throw new Error(`Cannot grant trail ${trailId}: it has no stops.`)
  }

  const purchaseId = randomUUID()
  const now = new Date().toISOString()

  const stmts = [
    {
      sql: `INSERT INTO purchases
              (id, user_id, trail_id, status, payment_provider, payment_ref, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [purchaseId, userId, trailId, 'owned', payment.provider, payment.ref, now],
    },
    ...stops.map((s) => ({
      sql: `INSERT INTO redemptions
              (id, purchase_id, stop_id, redeem_token, status)
            VALUES (?,?,?,?, 'unredeemed')`,
      args: [randomUUID(), purchaseId, s.id, newRedeemToken()],
    })),
  ]

  await db.batch(stmts, 'write')
  return purchaseId
}

function newRedeemToken(): string {
  return (randomUUID() + randomUUID()).replace(/-/g, '')
}
