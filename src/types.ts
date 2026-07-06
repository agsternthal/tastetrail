// Shared domain types for TasteTrail.

// ---------------------------------------------------------------------------
// Trail tags: region, drink type, style.
// ---------------------------------------------------------------------------
export type TagCategory = 'Region' | 'DrinkType' | 'Style'

export interface Tag {
  category: TagCategory
  label: string
}

// ---------------------------------------------------------------------------
// Booking flag per stop.
// ---------------------------------------------------------------------------
export type BookingType = 'walk_in' | 'recommended' | 'required'

// ---------------------------------------------------------------------------
// Content blocks. The `pour` block is the new drink-specific type.
// All blocks live in trail_stops.content_json — new types need NO schema change.
// ---------------------------------------------------------------------------
export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'video'; url: string; poster?: string; caption?: string }
  | { type: 'gallery'; images: { url: string; caption?: string }[] }
  | { type: 'challenge'; prompt: string; options: string[]; answerIndex: number; reveal?: string }
  | {
      type: 'pour'
      varietal: string
      style?: string
      abv?: string
      producer?: string
      tasting_notes?: string
    }

export interface User {
  id: string
  email: string
  created_at: string
}

// Google Places opening-hours period.
export interface OpeningPeriod {
  open: { day: number; time: string }
  close?: { day: number; time: string }
}

export interface Trail {
  id: string
  region: string
  title: string
  summary: string
  description: string
  price_cents: number
  currency: string
  duration_min: number
  stop_count: number
  hero_image: string
  included: string[]
  tags: Tag[]
  drink_types: string[]
  unit_system: 'imperial' | 'metric'
  timezone: string
  best_time: string | null
}

export interface TrailStop {
  id: string
  trail_id: string
  position: number
  name: string
  address: string
  lat: number
  lng: number
  tasting: string
  content: ContentBlock[]
  note: string | null
  hours: string[]
  hours_periods: OpeningPeriod[]
  photo_ref: string | null
  map_url: string | null
  booking_type: BookingType
  booking_url: string | null
  drive_time_to_next_min: number | null
  lunch_close_start: string | null
  lunch_close_end: string | null
}

export type PurchaseStatus = 'owned' | 'refunded'

export interface Purchase {
  id: string
  user_id: string
  trail_id: string
  status: PurchaseStatus
  payment_provider: string
  payment_ref: string | null
  created_at: string
}

export type RedemptionStatus = 'unredeemed' | 'redeemed'

export interface Redemption {
  id: string
  purchase_id: string
  stop_id: string
  redeem_token: string
  status: RedemptionStatus
  visited_at: string | null
  redeemed_at: string | null
}

export interface StopProgress extends TrailStop {
  redemption_id: string
  redeem_token: string
  visited_at: string | null
  redeemed_at: string | null
}
