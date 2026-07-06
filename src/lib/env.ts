function required(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`
    )
  }
  return v
}

export const env = {
  tursoUrl: () => required('TURSO_DATABASE_URL'),
  tursoToken: () => process.env.TURSO_AUTH_TOKEN ?? '',
  resendApiKey: () => required('RESEND_API_KEY'),
  authEmailFrom: () => process.env.AUTH_EMAIL_FROM ?? 'TasteTrail <onboarding@resend.dev>',
  authSecret: () => required('AUTH_SECRET'),
  appUrl: () =>
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000',
  googlePlacesKey: () => process.env.GOOGLE_PLACES_API_KEY ?? '',
}

export const publicEnv = {
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '',
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
}
