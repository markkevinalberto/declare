"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookOpenText, GripVertical, ImageIcon, Music, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

export type PlanItem = Database["public"]["Tables"]["service_plan_items"]["Row"];

export function PlanItemRow({
  item,
  runningTime,
  isScheduler,
  onSave,
  onDelete,
}: {
  item: PlanItem;
  runningTime: string;
  isScheduler: boolean;
  onSave: (id: string, data: { title: string; description?: string; duration_minutes: number }) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: !isScheduler });

  const [synced, setSynced] = useState(item);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [duration, setDuration] = useState(item.duration_minutes);

  if (item !== synced) {
    setSynced(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setDuration(item.duration_minutes);
  }

  function commit() {
    if (
      title !== item.title ||
      description !== (item.description ?? "") ||
      duration !== item.duration_minutes
    ) {
      onSave(item.id, { title, description, duration_minutes: duration });
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (item.type === "header") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-2 rounded-lg bg-muted/70 px-2 py-2",
          isDragging && "z-10 opacity-80"
        )}
      >
        {isScheduler ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing print:hidden"
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          disabled={!isScheduler}
          className="border-none bg-transparent px-1 font-semibold uppercase tracking-wide shadow-none focus-visible:ring-1"
        />
        {isScheduler ? (
          <Button
            variant="ghost"
            size="icon-lg"
            className="print:hidden"
            aria-label="Delete item"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
    );
  }

  if (item.type === "note") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-start gap-2 rounded-lg border-l-2 border-amber-400 bg-amber-50 px-2 py-2 dark:bg-amber-950/30",
          isDragging && "z-10 opacity-80"
        )}
      >
        {isScheduler ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="mt-1.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing print:hidden"
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
        <Textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          disabled={!isScheduler}
          rows={1}
          className="resize-none border-none bg-transparent px-1 text-sm italic text-muted-foreground shadow-none focus-visible:ring-1"
        />
        {isScheduler ? (
          <Button
            variant="ghost"
            size="icon-lg"
            className="print:hidden"
            aria-label="Delete item"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2 py-2",
        isDragging && "z-10 opacity-80"
      )}
    >
      {isScheduler ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing print:hidden"
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}
      <span className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
        {runningTime}
      </span>
      {item.type === "song" ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Music className="size-3.5" />
        </span>
      ) : null}
      {item.type === "bible" ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <BookOpenText className="size-3.5" />
        </span>
      ) : null}
      {item.type === "media" ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <ImageIcon className="size-3.5" />
        </span>
      ) : null}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commit}
          disabled={!isScheduler}
          className="border-none bg-transparent px-1 shadow-none focus-visible:ring-1"
        />
        {(description || isScheduler) && (
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={commit}
            disabled={!isScheduler}
            placeholder={isScheduler ? "Description (optional)" : ""}
            className="h-7 border-none bg-transparent px-1 text-xs text-muted-foreground shadow-none focus-visible:ring-1"
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {item.type === "song" && item.song_key ? (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Key of {item.song_key}
          </Badge>
        ) : null}
        <Input
          type="number"
          min={0}
          max={600}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          onBlur={commit}
          disabled={!isScheduler}
          className="w-14 border-none bg-transparent px-1 text-right shadow-none focus-visible:ring-1"
        />
        <span className="text-xs text-muted-foreground">min</span>
      </div>
      {isScheduler ? (
        <Button
          variant="ghost"
          size="icon-lg"
          className="print:hidden"
          aria-label="Delete item"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 />
        </Button>
      ) : null}
    </div>
  );
}
