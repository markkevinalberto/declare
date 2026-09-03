import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_DEFS, TEMPLATE_KEYS } from "@/lib/sms-template-defs";
import { SmsTemplateEditor, type TemplateRow } from "./sms-template-editor";

export default async function SmsTemplatesPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: overrides }, { data: authors }] = await Promise.all([
    supabase
      .from("sms_templates")
      .select("key, template, updated_at, updated_by")
      .eq("org_id", profile.org_id),
    supabase.from("profiles").select("id, name, email").eq("org_id", profile.org_id),
  ]);

  const authorById = new Map((authors ?? []).map((a) => [a.id, a.name || a.email]));
  const overrideByKey = new Map((overrides ?? []).map((o) => [o.key, o]));

  const rows: TemplateRow[] = TEMPLATE_KEYS.map((key) => {
    const def = TEMPLATE_DEFS[key];
    const override = overrideByKey.get(key);
    return {
      key,
      title: def.title,
      description: def.description,
      vars: def.vars,
      default: def.default,
      template: override?.template ?? def.default,
      isCustom: Boolean(override),
      updatedAt: override?.updated_at ?? null,
      updatedByName: override?.updated_by ? (authorById.get(override.updated_by) ?? null) : null,
    };
  });

  return (
    <div className="grid max-w-2xl gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SMS message templates</h1>
        <p className="text-sm text-muted-foreground">
          Customize the wording of every automatic text message Declare sends
          to your team&apos;s mobile numbers.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminder texts</CardTitle>
          <CardDescription>
            Sent alongside the existing email reminders, 3 days and 1 day
            before a service, to anyone with a mobile number on file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmsTemplateEditor rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
