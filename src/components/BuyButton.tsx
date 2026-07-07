'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuyButton({
  trailId,
  isAuthed,
  priceLabel,
  onBrand = false,
}: {
  trailId: string
  isAuthed: boolean
  priceLabel: string
  onBrand?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function buy() {
    setError(null)
    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(`/trails/${trailId}`)}`)
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trailId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Purchase failed.')
      router.push(`/trails/${trailId}/follow`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed.')
      setBusy(false)
    }
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={buy}
        disabled={busy}
        className={`w-full rounded-xl px-5 py-4 text-center font-semibold shadow-sm active:scale-[.99] disabled:opacity-60 ${
          onBrand
            ? 'bg-white text-brand'
            : 'bg-brand text-white'
        }`}
      >
        {busy ? 'Unlocking...' : `Get this trail · ${priceLabel}`}
      </button>
      <p className={`mt-2 text-center text-xs ${onBrand ? 'text-brand-light' : 'text-stone-400'}`}>
        Test mode - no card is charged. Instant access.
      </p>
    </div>
  )
}
