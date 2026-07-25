import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revokeInvite } from "@/app/(app)/settings/actions";

type Invite = { id: string; email: string; role: string; created_at: string };

export function PendingInvites({ invites }: { invites: Invite[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pending invites</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{invite.email}</span>
              <Badge variant="secondary" className="capitalize">
                {invite.role}
              </Badge>
            </div>
            <form action={revokeInvite.bind(null, invite.id)}>
              <Button type="submit" variant="ghost" size="sm">
                Revoke
              </Button>
            </form>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
