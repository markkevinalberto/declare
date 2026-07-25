import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revokeInvite } from "./actions";

type Invite = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  accepted_at: string | null;
};

export function InvitesList({ invites }: { invites: Invite[] }) {
  if (invites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pending invites.</p>
    );
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Pending invites</p>
      <ul className="grid gap-2">
        {invites.map((invite) => (
          <li
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
          </li>
        ))}
      </ul>
    </div>
  );
}
