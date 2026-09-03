import "server-only";

// The AkeriusSMS gateway — a phone with a real Philippine SIM, running a
// companion Android app that polls for queued jobs and sends them. Not a
// third-party SMS API: it's a sibling project's own integration point,
// authenticated with a gateway key generated (and revocable) from that
// app's own Settings screen. See jcsgo-room-booking's
// src/app/api/sms-gateway/send/route.ts for the receiving end.
const GATEWAY_URL = "https://jcsgo-room-booking.vercel.app/api/sms-gateway/send";

// Strict Philippine mobile format the gateway requires — matches PH_MOBILE_RE
// in jcsgo-room-booking's src/lib/sms.ts exactly, since that's what actually
// validates the request on the receiving end.
const PH_MOBILE_RE = /^09\d{9}$/;

/**
 * Normalizes common ways a PH mobile number gets typed/stored (with
 * spaces/dashes, a +63 or 63 country code, etc.) into the gateway's exact
 * required shape. Returns null if it doesn't look like a PH mobile number
 * at all — callers should skip sending rather than let the gateway 400.
 */
export function normalizePhMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("63")
    ? `0${digits.slice(2)}`
    : digits.startsWith("9") && digits.length === 10
      ? `0${digits}`
      : digits;
  return PH_MOBILE_RE.test(local) ? local : null;
}

export async function sendSms(
  rawPhone: string,
  message: string
): Promise<{ skipped: boolean; error?: string }> {
  const key = process.env.SMS_GATEWAY_KEY;
  if (!key) {
    console.warn("[sms] SMS_GATEWAY_KEY not set — skipping send");
    return { skipped: true };
  }

  const receiver = normalizePhMobile(rawPhone);
  if (!receiver) {
    console.warn(`[sms] "${rawPhone}" isn't a valid PH mobile number — skipping`);
    return { skipped: true, error: "invalid_phone" };
  }

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ receiver, message: message.slice(0, 1000) }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[sms] gateway send failed (${res.status})`, body);
      return { skipped: false, error: `gateway_${res.status}` };
    }
    return { skipped: false };
  } catch (error) {
    console.error("[sms] gateway request failed", error);
    return { skipped: false, error: "network" };
  }
}
