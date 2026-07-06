import { notFound } from 'next/navigation'
import { redeemByToken } from '@/lib/redeem'

export const dynamic = 'force-dynamic'

export default async function RedeemPage({ params }: { params: { token: string } }) {
  const outcome = await redeemByToken(params.token)

  if (outcome.result === 'not_found') notFound()

  const { view } = outcome
  const justRedeemed = outcome.result === 'redeemed'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm">
        <div className="text-5xl">{justRedeemed ? '🎉' : '✅'}</div>
        <h1 className="mt-4 text-2xl font-bold">
          {justRedeemed ? 'Tasting redeemed!' : 'Already redeemed'}
        </h1>
        <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-brand">
          {view.trail_region} · Stop {view.position}
        </div>
        <h2 className="mt-1 text-lg font-bold">{view.stop_name}</h2>
        <p className="mt-3 rounded-xl bg-brand/5 px-4 py-3 text-sm text-stone-700">
          {view.tasting}
        </p>
        {!justRedeemed && view.redeemed_at && (
          <p className="mt-3 text-xs text-stone-400">
            Redeemed {new Date(view.redeemed_at).toLocaleString()}
          </p>
        )}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Please drink responsibly and enjoy your tasting.
        </div>
      </div>
    </main>
  )
}
