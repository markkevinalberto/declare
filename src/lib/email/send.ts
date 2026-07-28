import "server-only";
import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

/** Extracts the bare address out of `RESEND_FROM_EMAIL` (which may be a
 * plain address or a `"Name <address>"` pair) so a per-org display name can
 * be substituted while still sending from the one verified address. */
function verifiedFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL ?? "Declare <onboarding@resend.dev>";
  const match = configured.match(/<([^>]+)>/);
  return match ? match[1] : configured;
}

export async function sendEmail({
  to,
  subject,
  html,
  fromName,
}: {
  to: string;
  subject: string;
  html: string;
  /** Displayed sender name — e.g. the org's own name — so every church's
   * emails don't all appear to come from whichever org's name was baked
   * into the environment variable. Falls back to RESEND_FROM_EMAIL as-is. */
  fromName?: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping send to ${to}: "${subject}"`
    );
    return { skipped: true };
  }

  const from = fromName
    ? `${fromName} <${verifiedFromAddress()}>`
    : (process.env.RESEND_FROM_EMAIL ?? "Declare <onboarding@resend.dev>");
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error("[email] send failed", error);
    return { skipped: false, error };
  }
  return { skipped: false };
}
