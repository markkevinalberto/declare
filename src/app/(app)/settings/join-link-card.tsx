"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { regenerateJoinLink } from "./actions";

export function JoinLinkCard({ token }: { token: string | null }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const link = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${token}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function regenerate() {
    startTransition(async () => {
      const result = await regenerateJoinLink();
      if (result?.error) toast.error(result.error);
      else toast.success(result?.success ?? "New link generated.");
    });
  }

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        No join link available. Click below to generate one.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <Input readOnly value={link} className="font-mono text-xs" />
        <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copy link">
          {copied ? <Check className="text-green-600" /> : <Copy />}
        </Button>
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={regenerate} disabled={pending}>
          <RefreshCw className={pending ? "animate-spin" : undefined} />
          {pending ? "Generating…" : "Reset link"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Anyone with this link can join your church as a Member. Resetting it
          invalidates the old link.
        </p>
      </div>
    </div>
  );
}
