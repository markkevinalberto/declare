"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FileText, Plus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  createPlanItem,
  deletePlanItem,
  reorderPlanItems,
  updatePlanItem,
} from "./actions";
import { PlanItemRow, type PlanItem } from "./plan-item-row";
import { SongPickerPopover } from "./song-picker-popover";

const TIMED_TYPES: PlanItem["type"][] = ["item", "song"];

function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function PlanBuilder({
  serviceId,
  initialItems,
  isScheduler,
}: {
  serviceId: string;
  initialItems: PlanItem[];
  isScheduler: boolean;
}) {
  const [items, setItems] = useState<PlanItem[]>(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const supabase = createClient();

    async function refetch() {
      const { data } = await supabase
        .from("service_plan_items")
        .select("*")
        .eq("service_id", serviceId)
        .order("sort_order");
      if (data) setItems(data);
    }

    const channel = supabase
      .channel(`plan:${serviceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_plan_items",
          filter: `service_id=eq.${serviceId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serviceId]);

  const runningTimes = useMemo(() => {
    const map = new Map<string, string>();
    let cumulative = 0;
    for (const item of items) {
      if (TIMED_TYPES.includes(item.type)) {
        map.set(item.id, formatMinutes(cumulative));
        cumulative += item.duration_minutes;
      } else {
        map.set(item.id, "");
      }
    }
    return map;
  }, [items]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (TIMED_TYPES.includes(i.type) ? i.duration_minutes : 0),
        0
      ),
    [items]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      reorderPlanItems(serviceId, next.map((i) => i.id));
      return next;
    });
  }

  function handleSave(id: string, data: { title: string; description?: string; duration_minutes: number }) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data, description: data.description ?? null } : i)));
    updatePlanItem(id, serviceId, data);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    deletePlanItem(id, serviceId);
  }

  async function refetchItems() {
    const supabase = createClient();
    const { data } = await supabase
      .from("service_plan_items")
      .select("*")
      .eq("service_id", serviceId)
      .order("sort_order");
    if (data) setItems(data);
  }

  async function handleAdd(type: PlanItem["type"]) {
    await createPlanItem(serviceId, type);
    await refetchItems();
  }

  return (
    <Card className="print:border-none print:shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Service plan</CardTitle>
        <span className="text-sm text-muted-foreground">
          Total: {formatMinutes(total)}
        </span>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {isScheduler
              ? "Add your first item to start building the flow."
              : "No plan items yet."}
          </p>
        ) : (
          <DndContext
            id={`plan-${serviceId}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-1.5">
                {items.map((item) => (
                  <PlanItemRow
                    key={item.id}
                    item={item}
                    runningTime={runningTimes.get(item.id) ?? ""}
                    isScheduler={isScheduler}
                    onSave={handleSave}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
      {isScheduler ? (
        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30 print:hidden">
          <Button variant="outline" size="sm" onClick={() => handleAdd("item")}>
            <Plus /> Item
          </Button>
          <SongPickerPopover serviceId={serviceId} onAdded={refetchItems} />
          <Button variant="outline" size="sm" onClick={() => handleAdd("header")}>
            <Type /> Section header
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAdd("note")}>
            <FileText /> Note
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
