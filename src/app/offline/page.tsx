export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl">🍷</div>
      <h1 className="mt-4 text-xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-stone-600">
        Connect to the internet to load trails and stop content.
        <br />
        Your progress is saved.
      </p>
    </main>
  )
}
