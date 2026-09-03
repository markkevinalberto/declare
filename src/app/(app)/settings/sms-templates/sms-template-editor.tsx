"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  renderSmsTemplate,
  type TemplateVarDef,
} from "@/lib/sms-template-defs";
import { resetSmsTemplate, saveSmsTemplate } from "./actions";

export type TemplateRow = {
  key: string;
  title: string;
  description: string;
  vars: TemplateVarDef[];
  default: string;
  template: string;
  isCustom: boolean;
  updatedAt: string | null;
  updatedByName: string | null;
};

function TemplateCard({ row }: { row: TemplateRow }) {
  const [draft, setDraft] = useState(row.template);
  const [pending, setPending] = useState<"save" | "reset" | null>(null);

  const sampleVars = Object.fromEntries(row.vars.map((v) => [v.name, v.sample]));
  const preview = renderSmsTemplate(draft, sampleVars);

  async function handleSave() {
    setPending("save");
    const result = await saveSmsTemplate(row.key, draft);
    setPending(null);
    if (result?.error) toast.error(result.error);
    else toast.success("Template saved");
  }

  async function handleReset() {
    setPending("reset");
    const result = await resetSmsTemplate(row.key);
    setPending(null);
    if (result?.error) toast.error(result.error);
    else {
      setDraft(row.default);
      toast.success("Reset to default");
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-medium">
            {row.title}
            {row.isCustom ? <Badge variant="secondary">Customized</Badge> : null}
          </p>
          <p className="text-xs text-muted-foreground">{row.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {row.vars.map((v) => (
          <code
            key={v.name}
            title={v.label}
            className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            {`{{${v.name}}}`}
          </code>
        ))}
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={7}
        className="font-mono text-sm"
      />

      <div className="grid gap-1">
        <p className="text-xs font-medium text-muted-foreground">Preview (sample data)</p>
        <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">
          {preview}
        </pre>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={pending !== null || !draft.trim()} onClick={handleSave}>
          {pending === "save" ? "Saving…" : "Save"}
        </Button>
        {row.isCustom ? (
          <Button
            size="sm"
            variant="outline"
            disabled={pending !== null}
            onClick={handleReset}
          >
            <RotateCcw /> Reset to default
          </Button>
        ) : null}
        {row.isCustom && row.updatedByName ? (
          <span className="text-xs text-muted-foreground">
            Last edited by {row.updatedByName}
            {row.updatedAt ? ` on ${new Date(row.updatedAt).toLocaleString()}` : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SmsTemplateEditor({ rows }: { rows: TemplateRow[] }) {
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <TemplateCard key={row.key} row={row} />
      ))}
    </div>
  );
}
