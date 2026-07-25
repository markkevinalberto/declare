"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireScheduler } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { createClient as createClientType } from "@/lib/supabase/server";

export type ServiceActionState = { error?: string } | undefined;

async function notifyAffectedVolunteers(
  supabase: Awaited<ReturnType<typeof createClientType>>,
  orgId: string,
  serviceId: string,
  serviceTitle: string,
  type: "service_updated" | "service_cancelled",
  body: string
) {
  const { data: positions } = await supabase
    .from("positions")
    .select("user_id")
    .eq("service_id", serviceId)
    .neq("status", "declined")
    .not("user_id", "is", null);

  const userIds = [...new Set((positions ?? []).map((p) => p.user_id!).filter(Boolean))];
  if (userIds.length === 0) return;

  await supabase.from("notifications").insert(
    userIds.map((userId) => ({
      org_id: orgId,
      user_id: userId,
      type,
      title: type === "service_cancelled" ? `Cancelled: ${serviceTitle}` : `Updated: ${serviceTitle}`,
      body,
      link: "/my-schedule",
    }))
  );
}

const serviceSchema = z.object({
  title: z.string().min(1, "Title is required."),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  campus: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.enum(["yes", "no"]).default("no"),
  frequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  occurrences: z.coerce.number().int().min(1).max(52).optional(),
});

function addOccurrence(date: Date, frequency: string, index: number) {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7 * index);
  else if (frequency === "biweekly") next.setDate(next.getDate() + 14 * index);
  else next.setMonth(next.getMonth() + index);
  return next;
}

export async function createService(
  _prevState: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const profile = await requireScheduler();
  const parsed = serviceSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    time: formData.get("time"),
    campus: formData.get("campus") || undefined,
    notes: formData.get("notes") || undefined,
    recurring: formData.get("recurring") || "no",
    frequency: formData.get("frequency") || undefined,
    occurrences: formData.get("occurrences") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time}`);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Enter a valid date and time." };
  }

  const supabase = await createClient();

  if (parsed.data.recurring === "yes" && parsed.data.frequency) {
    const occurrences = parsed.data.occurrences ?? 8;

    const { data: series, error: seriesError } = await supabase
      .from("service_series")
      .insert({
        org_id: profile.org_id,
        title: parsed.data.title,
        campus: parsed.data.campus ?? null,
        frequency: parsed.data.frequency,
        day_of_week: startsAt.getDay(),
        time_of_day: parsed.data.time,
      })
      .select("id")
      .single();
    if (seriesError) return { error: seriesError.message };

    const rows = Array.from({ length: occurrences }, (_, i) => ({
      org_id: profile.org_id,
      series_id: series.id,
      title: parsed.data.title,
      starts_at: addOccurrence(startsAt, parsed.data.frequency!, i).toISOString(),
      campus: parsed.data.campus ?? null,
      notes: parsed.data.notes ?? null,
      created_by: profile.id,
    }));

    const { error } = await supabase.from("services").insert(rows);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("services").insert({
      org_id: profile.org_id,
      title: parsed.data.title,
      starts_at: startsAt.toISOString(),
      campus: parsed.data.campus ?? null,
      notes: parsed.data.notes ?? null,
      created_by: profile.id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/services");
  revalidatePath("/dashboard");
  return undefined;
}

export async function duplicateService(serviceId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("services")
    .select("title, campus, notes")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();
  if (!original) return;

  const { data: items } = await supabase
    .from("service_plan_items")
    .select("type, title, description, duration_minutes, sort_order")
    .eq("service_id", serviceId)
    .order("sort_order");

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);

  const { data: created, error } = await supabase
    .from("services")
    .insert({
      org_id: profile.org_id,
      title: original.title,
      campus: original.campus,
      notes: original.notes,
      starts_at: nextWeek.toISOString(),
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error || !created) return;

  if (items && items.length > 0) {
    await supabase.from("service_plan_items").insert(
      items.map((item) => ({ ...item, service_id: created.id }))
    );
  }

  revalidatePath("/services");
  redirect(`/services/${created.id}`);
}

export async function deleteService(serviceId: string) {
  const profile = await requireScheduler();
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("title")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();

  if (service) {
    await notifyAffectedVolunteers(
      supabase,
      profile.org_id,
      serviceId,
      service.title,
      "service_cancelled",
      "This service has been cancelled and you're no longer scheduled."
    );
  }

  await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("org_id", profile.org_id);
  revalidatePath("/services");
  revalidatePath("/dashboard");
}

const updateServiceSchema = z.object({
  title: z.string().min(1, "Title is required."),
  date: z.string().min(1),
  time: z.string().min(1),
  campus: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateService(
  serviceId: string,
  _prevState: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const profile = await requireScheduler();
  const parsed = updateServiceSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    time: formData.get("time"),
    campus: formData.get("campus") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time}`);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Enter a valid date and time." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("services")
    .select("starts_at, campus")
    .eq("id", serviceId)
    .eq("org_id", profile.org_id)
    .single();

  const { error } = await supabase
    .from("services")
    .update({
      title: parsed.data.title,
      starts_at: startsAt.toISOString(),
      campus: parsed.data.campus ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", serviceId)
    .eq("org_id", profile.org_id);
  if (error) return { error: error.message };

  const scheduleChanged =
    existing &&
    (new Date(existing.starts_at).getTime() !== startsAt.getTime() ||
      (existing.campus ?? null) !== (parsed.data.campus ?? null));

  if (scheduleChanged) {
    await notifyAffectedVolunteers(
      supabase,
      profile.org_id,
      serviceId,
      parsed.data.title,
      "service_updated",
      "The date, time, or location changed for a service you're scheduled for."
    );
  }

  revalidatePath("/services");
  revalidatePath(`/services/${serviceId}`);
  revalidatePath("/dashboard");
  return undefined;
}
