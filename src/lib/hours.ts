import type { OpeningPeriod } from '@/types'

const WEEK = 7 * 1440

function toMin(day: number, hhmm: string): number {
  return day * 1440 + parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(2), 10)
}

/** true = open, false = closed, null = unknown. */
export function isOpenNow(periods: OpeningPeriod[] | undefined, now = new Date()): boolean | null {
  if (!periods || periods.length === 0) return null
  const nowMin = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes()
  for (const p of periods) {
    if (!p?.open) continue
    if (!p.close) return true
    const o = toMin(p.open.day, p.open.time)
    let c = toMin(p.close.day, p.close.time)
    if (c <= o) c += WEEK
    if ((nowMin >= o && nowMin < c) || (nowMin + WEEK >= o && nowMin + WEEK < c)) return true
  }
  return false
}

/** Google weekday_text is Monday-first; return today's hours line. */
export function todayHours(weekdayText: string[] | undefined, now = new Date()): string | null {
  if (!weekdayText || weekdayText.length < 7) return null
  const idx = (now.getDay() + 6) % 7
  const line = weekdayText[idx]
  if (!line) return null
  const colon = line.indexOf(':')
  return colon >= 0 ? line.slice(colon + 1).trim() : line
}

/**
 * Returns true if the current time falls in a lunch closure window.
 * Closure stored as "HH:MM" strings (e.g., "12:00" and "14:00").
 * Used for Burgundy stops with midday French closures.
 */
export function isLunchClosed(
  lunchStart: string | null,
  lunchEnd: string | null,
  now = new Date()
): boolean {
  if (!lunchStart || !lunchEnd) return false
  const [sh, sm] = lunchStart.split(':').map(Number)
  const [eh, em] = lunchEnd.split(':').map(Number)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  return nowMin >= startMin && nowMin < endMin
}
