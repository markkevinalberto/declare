import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { PreferenceToggles } from "./preference-toggles";

const CATEGORIES = [
  { key: "invite", label: "Invitation to serve", description: "When a leader schedules you for a service." },
  { key: "reminder", label: "Upcoming service reminders", description: "3 days and 1 day before you're serving." },
  { key: "accepted", label: "Volunteer accepted", description: "When someone you invited accepts (leaders only)." },
  { key: "declined", label: "Volunteer declined", description: "When someone you invited declines (leaders only)." },
  { key: "service_updated", label: "Service updated", description: "When details change for a service you're on." },
  { key: "service_cancelled", label: "Service cancelled", description: "When a service you're scheduled for is cancelled." },
  { key: "position_removed", label: "Removed from a position", description: "When a leader removes you from a role." },
] as const;

export default async function NotificationPreferencesPage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("category, email_enabled")
    .eq("user_id", profile.id);

  const enabledByCategory = new Map((prefs ?? []).map((p) => [p.category, p.email_enabled]));

  return (
    <div className="grid max-w-lg gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notification preferences</h1>
        <p className="text-sm text-muted-foreground">
          Choose which events send you an email. In-app notifications (the bell
          icon) always show everything.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email notifications</CardTitle>
          <CardDescription>On by default for every category.</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferenceToggles
            items={CATEGORIES.map((c) => ({
              ...c,
              enabled: enabledByCategory.get(c.key) ?? true,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
