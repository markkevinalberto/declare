import { AppShell } from "@/components/layout/app-shell";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const [{ data: org }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.org_id)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .is("read_at", null),
  ]);

  const isScheduler = profile.role === "admin" || profile.role === "leader";

  return (
    <AppShell
      orgName={org?.name ?? "Declare"}
      isScheduler={isScheduler}
      isAdmin={profile.role === "admin"}
      unreadCount={unreadCount ?? 0}
      userName={profile.name || profile.email}
      userEmail={profile.email}
      avatarUrl={profile.avatar_url}
    >
      {children}
    </AppShell>
  );
}
