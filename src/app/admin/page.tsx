import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/(auth)/actions";
import { AdminUsersTable, type AdminUserRow } from "./admin-users-table";

export default async function AdminPage() {
  const profile = await requireSuperAdmin();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: orgs }, { data: authUsers }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, role, org_id, active, created_at, is_super_admin"),
      admin.from("organizations").select("id, name"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

  const orgNameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));
  const lastSignInById = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.last_sign_in_at])
  );

  const rows: AdminUserRow[] = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      name: p.name || p.email,
      email: p.email,
      role: p.role,
      orgName: p.org_id ? (orgNameById.get(p.org_id) ?? "Unknown org") : null,
      active: p.active,
      createdAt: p.created_at,
      lastSignInAt: lastSignInById.get(p.id) ?? null,
      isSuperAdmin: p.is_super_admin,
    }))
    .sort((a, b) => {
      if (!a.lastSignInAt && !b.lastSignInAt) return 0;
      if (!a.lastSignInAt) return -1;
      if (!b.lastSignInAt) return 1;
      return (
        new Date(a.lastSignInAt).getTime() - new Date(b.lastSignInAt).getTime()
      );
    });

  return (
    <div className="min-h-svh bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <ShieldCheck className="size-5 text-primary" />
        <span className="font-semibold">Super admin</span>
        <span className="min-w-0 flex-1" />
        <span className="text-sm text-muted-foreground">{profile.email}</span>
        <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
          Back to app
        </Button>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          All registered users
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Every user across every organization, sorted with never-signed-in
          accounts first — the easiest way to spot idle signups to clean up.
        </p>
        <AdminUsersTable rows={rows} currentUserId={profile.id} />
      </main>
    </div>
  );
}
