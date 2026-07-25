import { format } from "date-fns";
import { CalendarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteBlockout } from "./actions";
import { EditBlockoutDialog } from "./edit-blockout-dialog";

type Blockout = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
};

function parseDate(d: string) {
  return new Date(`${d}T00:00:00`);
}

export function BlockoutList({ blockouts }: { blockouts: Blockout[] }) {
  if (blockouts.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarOff className="size-4" /> No blockout dates yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {blockouts.map((b) => (
        <Card key={b.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">
                {b.start_date === b.end_date
                  ? format(parseDate(b.start_date), "MMMM d, yyyy")
                  : `${format(parseDate(b.start_date), "MMM d, yyyy")} – ${format(parseDate(b.end_date), "MMM d, yyyy")}`}
              </p>
              {b.reason ? (
                <p className="text-sm text-muted-foreground">{b.reason}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <EditBlockoutDialog blockout={b} />
              <ConfirmDeleteButton
                action={deleteBlockout.bind(null, b.id)}
                title="Delete this blockout?"
                description="Schedulers will no longer see this as unavailable time."
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
