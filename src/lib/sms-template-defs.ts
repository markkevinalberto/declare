// Definitions for every customizable SMS template: its default wording and
// the {{variable}} placeholders it can use. Kept dependency-free (no
// Supabase import) so it's safe to use from client components too, e.g. for
// a live preview while editing — mirrors the same pattern jcsgo-room-booking
// uses for its own SMS templates.

export type TemplateKey = "invite" | "reminder_pending" | "reminder_confirmed";

export type TemplateVarDef = { name: string; label: string; sample: string };

export type TemplateDef = {
  title: string;
  description: string;
  vars: TemplateVarDef[];
  default: string;
};

// Available if you want it, but PH carriers/phones commonly filter texts
// containing links as spam/smishing — confirmed via a live test where an
// identical message arrived instantly with the link removed and never
// arrived with it included. The built-in defaults below deliberately don't
// use this variable; add it back only if you've verified links get through
// on your recipients' carriers.
const respondUrlVar: TemplateVarDef = {
  name: "respondUrl",
  label: "Link to respond or view details (⚠️ often filtered as spam by PH carriers)",
  sample: "https://declare-cyan.vercel.app/respond/…",
};

const inviteVars: TemplateVarDef[] = [
  { name: "role", label: "Role name", sample: "Vocalist" },
  { name: "service", label: "Service title", sample: "Sunday Worship" },
  { name: "when", label: "Date & time", sample: "Sunday, September 6, 2026 · 9:00 AM" },
  respondUrlVar,
];

const reminderVars: TemplateVarDef[] = [
  ...inviteVars.slice(0, 3),
  { name: "daysAway", label: "Days until the service", sample: "3" },
  respondUrlVar,
];

export const TEMPLATE_DEFS: Record<TemplateKey, TemplateDef> = {
  invite: {
    title: "New invite (and resend)",
    description: "Sent the first time a scheduler invites you to a role, and again every time they hit Resend.",
    vars: inviteVars,
    default:
      "📣 You're Invited to Serve\n\n⛪ Role: {{role}}\n📌 Service: {{service}}\n🕒 When: {{when}}\n\n👉 Open Declare to accept or decline.",
  },
  reminder_pending: {
    title: "Reminder — hasn't responded yet",
    description: "Sent to a volunteer who was invited but hasn't accepted or declined yet.",
    vars: reminderVars,
    default:
      "🔔 Reminder: Please Respond\n\n⛪ Role: {{role}}\n📌 Service: {{service}}\n🕒 When: {{when}}\n⏳ {{daysAway}} day(s) away — you haven't responded yet.\n\n👉 Open Declare to respond.",
  },
  reminder_confirmed: {
    title: "Reminder — already confirmed",
    description: "Sent to a volunteer who already accepted, as a heads-up before the service.",
    vars: reminderVars,
    default:
      "✅ Reminder: You're Serving\n\n⛪ Role: {{role}}\n📌 Service: {{service}}\n🕒 When: {{when}}\n⏳ {{daysAway}} day(s) away.\n\nℹ️ Open Declare for details.",
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATE_DEFS) as TemplateKey[];

// A line referencing a variable that's empty/missing is dropped entirely —
// that's how an optional field would stay out of the message instead of
// leaving a dangling "Label: " with nothing after it. A line with no
// {{...}} reference (blank spacer lines included) always passes through.
export function renderSmsTemplate(
  template: string,
  vars: Record<string, string | null | undefined>
): string {
  const lines = template.split("\n");
  const rendered = lines
    .map((line) => {
      const refs = [...line.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
      if (refs.length > 0 && refs.some((r) => !vars[r])) return null;
      return line.replace(/\{\{(\w+)\}\}/g, (_, name: string) => vars[name] ?? "");
    })
    .filter((l): l is string => l !== null);
  return rendered.join("\n");
}
