import { format } from "date-fns";
import { MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { RespondButtons } from "./respond-buttons";

export default async function RespondPage({
  params,
}: {
  params: Promise<{ positionId: string }>;
}) {
  const { positionId } = await params;
  const profile = await requireOrgProfile();
  const supabase = await createClient();

  const { data: position } = await supabase
    .from("positions")
    .select(
      "id, status, user_id, services(title, starts_at, campus), roles(name)"
    )
    .eq("id", positionId)
    .single();

  if (!position || position.user_id !== profile.id) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Invite not found</CardTitle>
          <CardDescription>
            This invite doesn&apos;t exist or isn&apos;t addressed to you.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const service = position.services as unknown as {
    title: string;
    starts_at: string;
    campus: string | null;
  } | null;
  const role = position.roles as unknown as { name: string } | null;
  if (!service || !role) return null;

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">
          {role.name} — {service.title}
        </CardTitle>
        <CardDescription>
          <span className="flex flex-col gap-1">
            <span>{format(new Date(service.starts_at), "EEEE, MMMM d, yyyy · h:mm a")}</span>
            {service.campus ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {service.campus}
              </span>
            ) : null}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RespondButtons positionId={position.id} status={position.status} />
      </CardContent>
    </Card>
  );
}
