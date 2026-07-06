import Link from 'next/link'
import LoginForm from '@/components/LoginForm'

export const dynamic = 'force-dynamic'

const ERRORS: Record<string, string> = {
  invalid: 'That sign-in link is invalid. Request a new one below.',
  expired: 'That sign-in link expired. Request a new one below.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string }
}) {
  const initialError = searchParams.error ? ERRORS[searchParams.error] ?? null : null

  return (
    <main className="min-h-screen p-6">
      <Link href="/" className="text-sm text-stone-500">
        Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-stone-600">
        No password. We&apos;ll email you a link and a 6-digit code.
      </p>
      <div className="mt-6">
        <LoginForm next={searchParams.next ?? '/trails'} initialError={initialError} />
      </div>
    </main>
  )
}
