import Link from "next/link";
import { CalendarDays, Inbox, MapPin, UserX } from "lucide-react";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { formatInOrgTime } from "@/lib/org-time";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardIcon } from "@/components/shared/card-icon";
import { DevotionalPreviewCard } from "@/components/shared/devotional-preview-card";
import { RosterReelPlayer } from "@/components/remotion/roster-reel-player";
import type { ReelStatus, RosterReelProps } from "@/components/remotion/roster-reel";
import { distinctMascots } from "@/lib/mascots";

type ServiceRow = { id: string; title: string; starts_at: string; campus: string | null };
type PositionRow = {
  id: string;
  status: string;
  user_id: string | null;
  service_id: string;
  services: ServiceRow | null;
  roles: { name: string } | null;
  profiles: { name: string | null } | null;
};

type LineupRow = {
  status: ReelStatus;
  roles: { name: string } | null;
  profiles: { name: string | null } | null;
};
const STATUS_ORDER: Record<ReelStatus, number> = { accepted: 0, invited: 1, draft: 2, declined: 3 };

// Animated lineup card data for the next upcoming service (confirmed roles first)
async function getNextLineup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  service: ServiceRow | undefined,
  timezone: string
): Promise<{ href: string; reel: RosterReelProps } | null> {
  if (!service) return null;
  const { data } = await supabase
    .from("positions")
    .select("status, roles(name), profiles!positions_user_id_fkey(name)")
    .eq("service_id", service.id);
  const rows = ((data ?? []) as unknown as LineupRow[]).filter((r) => r.roles);
  if (rows.length === 0) return null;
  rows.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const shown = rows.slice(0, 6);
  const mascots = distinctMascots(shown.map((r) => [r.roles!.name]));
  return {
    href: `/services/${service.id}`,
    reel: {
      eyebrow: "Next service lineup",
      title: service.title,
      when: formatInOrgTime(service.starts_at, timezone, "EEE, MMM d · h:mm a"),
      mode: "live",
      roles: shown.map((r, i) => ({
        name: r.roles!.name,
        person: r.profiles?.name ?? null,
        mascot: mascots[i],
        status: r.status,
      })),
      totals: { confirmed: rows.filter((r) => r.status === "accepted").length, total: rows.length },
    },
  };
}

function LineupCard({ lineup }: { lineup: { href: string; reel: RosterReelProps } }) {
  return (
    <Link
      href={lineup.href}
      className="animate-fade-up block overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
    >
      <RosterReelPlayer {...lineup.reel} />
    </Link>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof CalendarDays; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
      <Icon className="size-6" />
      <p>{message}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await requireOrgProfile();
  const supabase = await createClient();
  const isScheduler = profile.role === "admin" || profile.role === "leader";
  const now = new Date().toISOString();

  const { data: org } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", profile.org_id)
    .single();
  const timezone = org?.timezone ?? "UTC";

  const { data: nextServices } = await supabase
    .from("services")
    .select("id, title, starts_at, campus")
    .eq("org_id", profile.org_id)
    .gte("starts_at", now)
    .order("starts_at")
    .limit(5);

  const lineup = await getNextLineup(supabase, nextServices?.[0], timezone);

  if (!isScheduler) {
    const { data: myPositions } = await supabase
      .from("positions")
      .select("id, status, service_id, services!inner(id, title, starts_at, campus), roles(name)")
      .eq("user_id", profile.id)
      .neq("status", "draft")
      .gte("services.starts_at", now);

    const rows = ((myPositions ?? []) as unknown as PositionRow[])
      .filter((p) => p.services)
      .sort((a, b) => new Date(a.services!.starts_at).getTime() - new Date(b.services!.starts_at).getTime());

    const upcoming = rows.filter((p) => p.status === "accepted").slice(0, 5);
    const pendingInvites = rows.filter((p) => p.status === "invited");

    return (
      <div className="grid gap-4">
        <div className="relative pb-2 pr-24 sm:pr-52">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {profile.name || profile.email}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s coming up.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/hero_thumbsup.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -top-3 z-10 h-28 w-auto drop-shadow-lg sm:-right-4 sm:-top-4 sm:h-52 md:-top-6"
          />
        </div>

        <DevotionalPreviewCard />

        {lineup ? <LineupCard lineup={lineup} /> : null}

        {pendingInvites.length > 0 ? (
          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <CardIcon icon={Inbox} /> Invites awaiting your response
              </CardTitle>
              <CardDescription>{pendingInvites.length} invite{pendingInvites.length === 1 ? "" : "s"} need an answer.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {pendingInvites.map((p) => (
                <Link
                  key={p.id}
                  href={`/respond/${p.id}`}
                  className="flex items-center justify-between rounded-md border p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm"
                >
                  <span>
                    <span className="font-medium">{p.roles?.name}</span> for {p.services!.title}
                  </span>
                  <span className="text-muted-foreground">
                    {formatInOrgTime(p.services!.starts_at, timezone, "MMM d, h:mm a")}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="animate-fade-up [animation-delay:80ms]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <CardIcon icon={CalendarDays} /> Your upcoming commitments
            </CardTitle>
            <CardDescription>Services you&apos;ve accepted to serve at.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} message="Nothing on your schedule yet." />
            ) : (
              <div className="grid gap-2">
                {upcoming.map((p) => (
                  <Link
                    key={p.id}
                    href={`/services/${p.service_id}`}
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm"
                  >
                    <span>
                      <span className="font-medium">{p.roles?.name}</span> for {p.services!.title}
                    </span>
                    <span className="text-muted-foreground">
                      {formatInOrgTime(p.services!.starts_at, timezone, "MMM d, h:mm a")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextServiceIds = (nextServices ?? []).map((s) => s.id);

  const [{ data: orgRoles }, { data: nextServicePositions }, { data: pendingPositions }] = await Promise.all([
    supabase.from("roles").select("id, name").eq("org_id", profile.org_id),
    nextServiceIds.length > 0
      ? supabase.from("positions").select("service_id, role_id").in("service_id", nextServiceIds)
      : Promise.resolve({ data: [] as { service_id: string; role_id: string }[] }),
    supabase
      .from("positions")
      .select(
        "id, status, service_id, services!inner(id, title, starts_at, campus), roles(name), profiles!positions_user_id_fkey(name)"
      )
      .eq("org_id", profile.org_id)
      .eq("status", "invited")
      .gte("services.starts_at", now),
  ]);

  const unfilled = (nextServices ?? []).flatMap((s) =>
    (orgRoles ?? [])
      .filter((r) => !(nextServicePositions ?? []).some((p) => p.service_id === s.id && p.role_id === r.id))
      .map((r) => ({ service: s, role: r }))
  );
  const pending = ((pendingPositions ?? []) as unknown as PositionRow[])
    .filter((p) => p.services)
    .sort((a, b) => new Date(a.services!.starts_at).getTime() - new Date(b.services!.starts_at).getTime());

  return (
    <div className="grid gap-4">
      <div className="relative pb-2 pr-24 sm:pr-52">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {profile.name || profile.email}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s coming up.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/hero_thumbsup.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-3 z-10 h-28 w-auto drop-shadow-lg sm:-right-4 sm:-top-4 sm:h-52 md:-top-6"
        />
      </div>

      <DevotionalPreviewCard />

      {lineup ? <LineupCard lineup={lineup} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <CardIcon icon={CalendarDays} /> Next services
            </CardTitle>
            <CardDescription>The next 5 services on the calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            {!nextServices || nextServices.length === 0 ? (
              <EmptyState icon={CalendarDays} message="No upcoming services scheduled." />
            ) : (
              <div className="grid gap-2">
                {nextServices.map((s) => {
                  const openCount = unfilled.filter((u) => u.service.id === s.id).length;
                  return (
                    <Link
                      key={s.id}
                      href={`/services/${s.id}`}
                      className="flex items-center justify-between rounded-md border p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{s.title}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {formatInOrgTime(s.starts_at, timezone, "EEE, MMM d · h:mm a")}
                          {s.campus ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" /> {s.campus}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      {openCount > 0 ? <Badge variant="secondary">{openCount} open</Badge> : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up [animation-delay:80ms]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <CardIcon icon={UserX} /> Unfilled positions
            </CardTitle>
            <CardDescription>Roles with no one assigned yet.</CardDescription>
          </CardHeader>
          <CardContent>
            {unfilled.length === 0 ? (
              <EmptyState icon={UserX} message="Every upcoming role is staffed." />
            ) : (
              <div className="grid gap-2">
                {unfilled.slice(0, 8).map((u, i) => (
                  <Link
                    key={`${u.service.id}-${u.role.id}-${i}`}
                    href={`/services/${u.service.id}`}
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm"
                  >
                    <span>
                      <span className="font-medium">{u.role.name}</span> for {u.service.title}
                    </span>
                    <span className="text-muted-foreground">
                      {formatInOrgTime(u.service.starts_at, timezone, "MMM d")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-up md:col-span-2 [animation-delay:160ms]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <CardIcon icon={Inbox} /> Pending responses
            </CardTitle>
            <CardDescription>Invited volunteers who haven&apos;t responded.</CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState icon={Inbox} message="No invites are waiting on a response." />
            ) : (
              <div className="grid gap-2">
                {pending.slice(0, 8).map((p) => (
                  <Link
                    key={p.id}
                    href={`/services/${p.service_id}`}
                    className="flex items-center justify-between rounded-md border p-3 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent hover:shadow-sm"
                  >
                    <span>
                      <span className="font-medium">{p.profiles?.name}</span> — {p.roles?.name} for{" "}
                      {p.services!.title}
                    </span>
                    <span className="text-muted-foreground">
                      {formatInOrgTime(p.services!.starts_at, timezone, "MMM d")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
