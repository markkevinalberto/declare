"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_KEYS, type TemplateKey } from "@/lib/sms-template-defs";

export type SmsTemplateActionState = { error?: string; success?: string } | undefined;

const keySchema = z.enum(TEMPLATE_KEYS as [TemplateKey, ...TemplateKey[]]);

export async function saveSmsTemplate(
  key: string,
  template: string
): Promise<SmsTemplateActionState> {
  const profile = await requireAdmin();
  const parsedKey = keySchema.safeParse(key);
  if (!parsedKey.success) return { error: "Unknown template." };
  if (!template.trim()) return { error: "Template can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("sms_templates").upsert({
    org_id: profile.org_id,
    key: parsedKey.data,
    template,
    updated_at: new Date().toISOString(),
    updated_by: profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/settings/sms-templates");
  return { success: "Saved." };
}

export async function resetSmsTemplate(key: string): Promise<SmsTemplateActionState> {
  const profile = await requireAdmin();
  const parsedKey = keySchema.safeParse(key);
  if (!parsedKey.success) return { error: "Unknown template." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sms_templates")
    .delete()
    .eq("org_id", profile.org_id)
    .eq("key", parsedKey.data);
  if (error) return { error: error.message };

  revalidatePath("/settings/sms-templates");
  return { success: "Reset to default." };
}
