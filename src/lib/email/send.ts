import "server-only";
import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping send to ${to}: "${subject}"`
    );
    return { skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Declare <onboarding@resend.dev>";
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error("[email] send failed", error);
    return { skipped: false, error };
  }
  return { skipped: false };
}
