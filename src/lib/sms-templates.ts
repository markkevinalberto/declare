import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderSmsTemplate,
  TEMPLATE_DEFS,
  type TemplateKey,
} from "@/lib/sms-template-defs";

export async function getSmsTemplateText(
  orgId: string,
  key: TemplateKey
): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("sms_templates")
    .select("template")
    .eq("org_id", orgId)
    .eq("key", key)
    .maybeSingle();
  return data?.template ?? TEMPLATE_DEFS[key].default;
}

/** Looks up an org's saved override for `key` (or falls back to the
 * built-in default) and fills in {{variable}} placeholders. */
export async function renderNamedSmsTemplate(
  orgId: string,
  key: TemplateKey,
  vars: Record<string, string | null | undefined>
): Promise<string> {
  const template = await getSmsTemplateText(orgId, key);
  return renderSmsTemplate(template, vars);
}
