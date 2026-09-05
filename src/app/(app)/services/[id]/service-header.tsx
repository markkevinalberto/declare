"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Link2, MapPin, Mic2, MonitorPlay, Pencil, Printer, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatInOrgTime } from "@/lib/org-time";
import { FEATURES } from "@/lib/features";
import { EditServiceDialog } from "./edit-service-dialog";

type Service = {
  id: string;
  title: string;
  starts_at: string;
  campus: string | null;
  notes: string | null;
  preacher_name: string | null;
  giving_exhorter_name: string | null;
  sermon_slides_url: string | null;
  share_token: string;
};

export function ServiceHeader({
  service,
  isScheduler,
  timezone,
}: {
  service: Service;
  isScheduler: boolean;
  timezone: string;
}) {
  const [editOpen, setEditOpen] = useState(false);

  function copyShareLink() {
    const url = `${window.location.origin}/plan/${service.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  }

  return (
    <Card className="print:border-none print:shadow-none">
      <CardContent className="flex flex-wrap items-start justify-between gap-3 py-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{service.title}</h1>
          <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{formatInOrgTime(service.starts_at, timezone, "EEEE, MMMM d, yyyy · h:mm a")}</span>
            {service.campus ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {service.campus}
              </span>
            ) : null}
          </p>
          {service.notes ? (
            <p className="text-sm text-muted-foreground">{service.notes}</p>
          ) : null}
          {service.preacher_name || service.giving_exhorter_name || service.sermon_slides_url ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {service.preacher_name ? (
                <span className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  <Mic2 className="size-3.5" /> {service.preacher_name}
                </span>
              ) : null}
              {service.giving_exhorter_name ? (
                <span className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  <Wallet className="size-3.5" /> {service.giving_exhorter_name}
                </span>
              ) : null}
              {service.sermon_slides_url ? (
                <a
                  href={service.sermon_slides_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-primary hover:bg-accent"
                >
                  <FileText className="size-3.5" /> Sermon slides
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1 print:hidden">
          {FEATURES.presenter ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={`/present/${service.id}`} target="_blank" rel="noreferrer" />}
            >
              <MonitorPlay /> Present
            </Button>
          ) : null}
          {FEATURES.planning ? (
            <Button variant="outline" size="sm" onClick={copyShareLink}>
              <Link2 /> Share link
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
          {isScheduler ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil /> Edit
            </Button>
          ) : null}
        </div>
      </CardContent>
      {isScheduler ? (
        <EditServiceDialog
          service={service}
          timezone={timezone}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </Card>
  );
}
