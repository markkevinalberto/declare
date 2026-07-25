import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Church, MapPin, Music } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const supabase = await createClient();

  const [{ data: services }, { data: items }] = await Promise.all([
    supabase.rpc("get_shared_service", { p_token: shareToken }),
    supabase.rpc("get_shared_service_plan_items", { p_token: shareToken }),
  ]);

  const service = services?.[0];
  if (!service) notFound();

  const planItems = items ?? [];
  const total = planItems.reduce(
    (sum, i) =>
      sum + (i.type === "item" || i.type === "song" ? i.duration_minutes : 0),
    0
  );

  let cumulative = 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Church className="size-4" /> {service.org_name}
        </div>
        <PrintButton />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{service.title}</h1>
      <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
        <span>{format(new Date(service.starts_at), "EEEE, MMMM d, yyyy · h:mm a")}</span>
        {service.campus ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {service.campus}
          </span>
        ) : null}
      </p>
      {service.notes ? (
        <p className="mt-2 text-sm text-muted-foreground">{service.notes}</p>
      ) : null}

      <div className="mt-6 grid gap-1.5">
        {planItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No plan items have been added yet.
          </p>
        ) : (
          planItems.map((item) => {
            if (item.type === "header") {
              return (
                <div
                  key={item.id}
                  className="mt-3 rounded-lg bg-muted/70 px-2 py-2 font-semibold uppercase tracking-wide first:mt-0"
                >
                  {item.title}
                </div>
              );
            }
            if (item.type === "note") {
              return (
                <div
                  key={item.id}
                  className="rounded-lg border-l-2 border-amber-400 bg-amber-50 px-2 py-2 text-sm italic text-muted-foreground dark:bg-amber-950/30"
                >
                  {item.title}
                </div>
              );
            }
            const runningTime = formatMinutes(cumulative);
            cumulative += item.duration_minutes;
            return (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border px-2 py-2">
                <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {runningTime}
                </span>
                {item.type === "song" ? (
                  <Music className="size-4 shrink-0 text-muted-foreground" />
                ) : null}
                <div className="grid flex-1 gap-0.5">
                  <span>{item.title}</span>
                  {item.description ? (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.duration_minutes} min
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-4 text-right text-sm text-muted-foreground">
        Total: {formatMinutes(total)}
      </p>
    </div>
  );
}
