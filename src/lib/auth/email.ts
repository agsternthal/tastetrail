import 'server-only'
import { Resend } from 'resend'
import { env } from '../env'

export async function sendLoginEmail(opts: {
  to: string
  code: string
  magicLink: string
}): Promise<void> {
  const resend = new Resend(env.resendApiKey())
  const { to, code, magicLink } = opts

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1917">
    <div style="font-size:22px;font-weight:700;color:#722F37">TasteTrail</div>
    <p style="font-size:16px;margin:24px 0 8px">Here's your sign-in link:</p>
    <p style="margin:0 0 24px">
      <a href="${magicLink}"
         style="display:inline-block;background:#722F37;color:#fff;text-decoration:none;
                padding:12px 20px;border-radius:10px;font-weight:600">
        Sign in to TasteTrail
      </a>
    </p>
    <p style="font-size:15px;margin:0 0 4px;color:#57534e">Or enter this code in the app:</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#1c1917">${code}</div>
    <p style="font-size:13px;color:#a8a29e;margin-top:24px">
      This link and code expire in 10 minutes. If you didn't request this, you can ignore this email.
    </p>
  </div>`

  const { error } = await resend.emails.send({
    from: env.authEmailFrom(),
    to,
    subject: `Your TasteTrail sign-in code: ${code}`,
    html,
  })
  if (error) {
    throw new Error(`Resend failed: ${error.message ?? String(error)}`)
  }
}
