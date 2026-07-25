import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const canRun = Boolean(url && anonKey && serviceRoleKey);

// These tests exercise the real Postgres trigger (enforce_position_transition)
// and RPC (scheduling_conflicts) rather than re-implementing that logic in
// JS — the business rules live in the database, so that's what needs
// verifying. Requires SUPABASE_SERVICE_ROLE_KEY in .env.local; skipped
// (not failed) otherwise so a fresh checkout without that key still passes.
describe.skipIf(!canRun)("scheduling engine (positions + conflicts)", () => {
  let admin: SupabaseClient<Database>;
  let orgId: string;
  let schedulerId: string;
  let volunteerId: string;
  let otherVolunteerId: string;
  let roleId: string;
  let serviceId: string;
  let otherServiceId: string;
  let unrelatedServiceId: string;
  let schedulerClient: SupabaseClient<Database>;
  let volunteerClient: SupabaseClient<Database>;
  let otherVolunteerClient: SupabaseClient<Database>;

  const stamp = Date.now();
  const password = "TestPassword123!";

  async function createAuthedUser(email: string) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("createUser failed");

    const client = createClient<Database>(url!, anonKey!);
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    return { id: data.user.id, client };
  }

  beforeAll(async () => {
    admin = createClient<Database>(url!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: `Test Org ${stamp}` })
      .select("id")
      .single();
    if (orgError || !org) throw orgError;
    orgId = org.id;

    const scheduler = await createAuthedUser(`scheduler+${stamp}@example.test`);
    const volunteer = await createAuthedUser(`volunteer+${stamp}@example.test`);
    const otherVolunteer = await createAuthedUser(`other+${stamp}@example.test`);
    schedulerId = scheduler.id;
    volunteerId = volunteer.id;
    otherVolunteerId = otherVolunteer.id;
    schedulerClient = scheduler.client;
    volunteerClient = volunteer.client;
    otherVolunteerClient = otherVolunteer.client;

    await admin
      .from("profiles")
      .update({ org_id: orgId, role: "leader" })
      .eq("id", schedulerId);
    await admin
      .from("profiles")
      .update({ org_id: orgId, role: "member" })
      .eq("id", volunteerId);
    await admin
      .from("profiles")
      .update({ org_id: orgId, role: "member" })
      .eq("id", otherVolunteerId);

    const { data: group } = await admin
      .from("role_groups")
      .insert({ org_id: orgId, name: "Test Group" })
      .select("id")
      .single();
    const { data: role } = await admin
      .from("roles")
      .insert({ org_id: orgId, role_group_id: group!.id, name: "Test Role" })
      .select("id")
      .single();
    roleId = role!.id;

    const sameDay = new Date();
    sameDay.setDate(sameDay.getDate() + 14);
    sameDay.setHours(9, 0, 0, 0);

    const { data: service } = await admin
      .from("services")
      .insert({
        org_id: orgId,
        title: "Test Service",
        starts_at: sameDay.toISOString(),
        created_by: schedulerId,
      })
      .select("id")
      .single();
    serviceId = service!.id;

    const sameDayLater = new Date(sameDay);
    sameDayLater.setHours(18, 0, 0, 0);
    const { data: otherService } = await admin
      .from("services")
      .insert({
        org_id: orgId,
        title: "Test Service Evening",
        starts_at: sameDayLater.toISOString(),
        created_by: schedulerId,
      })
      .select("id")
      .single();
    otherServiceId = otherService!.id;

    const differentDay = new Date(sameDay);
    differentDay.setDate(differentDay.getDate() + 7);
    const { data: unrelatedService } = await admin
      .from("services")
      .insert({
        org_id: orgId,
        title: "Test Service Unrelated Day",
        starts_at: differentDay.toISOString(),
        created_by: schedulerId,
      })
      .select("id")
      .single();
    unrelatedServiceId = unrelatedService!.id;
  });

  afterAll(async () => {
    if (!canRun) return;
    await admin.from("organizations").delete().eq("id", orgId);
    await admin.auth.admin.deleteUser(schedulerId);
    await admin.auth.admin.deleteUser(volunteerId);
    await admin.auth.admin.deleteUser(otherVolunteerId);
  });

  test("scheduler can create a draft position", async () => {
    const { data, error } = await schedulerClient
      .from("positions")
      .insert({
        org_id: orgId,
        service_id: serviceId,
        role_id: roleId,
        user_id: volunteerId,
        created_by: schedulerId,
      })
      .select("id, status")
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("draft");
  });

  test("member cannot see a draft position that isn't theirs as 'assigned'", async () => {
    // RLS hides other members' drafts; the assigned volunteer can see their
    // own row regardless (app never surfaces it as a live invite though).
    const { data } = await otherVolunteerClient
      .from("positions")
      .select("id")
      .eq("service_id", serviceId);
    expect(data ?? []).toHaveLength(0);
  });

  test("scheduler moves draft -> invited directly (unrestricted)", async () => {
    const { data: position } = await admin
      .from("positions")
      .select("id")
      .eq("service_id", serviceId)
      .eq("user_id", volunteerId)
      .single();

    const { data, error } = await schedulerClient
      .from("positions")
      .update({ status: "invited", invited_at: new Date().toISOString() })
      .eq("id", position!.id)
      .select("status")
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("invited");
  });

  test("volunteer CANNOT skip straight to an invalid transition (draft -> accepted)", async () => {
    const { data: draftPosition } = await admin
      .from("positions")
      .insert({
        org_id: orgId,
        service_id: otherServiceId,
        role_id: roleId,
        user_id: volunteerId,
        created_by: schedulerId,
        status: "draft",
      })
      .select("id")
      .single();

    const { error } = await volunteerClient
      .from("positions")
      .update({ status: "accepted" })
      .eq("id", draftPosition!.id);

    expect(error).not.toBeNull();

    await admin.from("positions").delete().eq("id", draftPosition!.id);
  });

  test("volunteer CAN accept their own invited -> accepted transition", async () => {
    const { data: position } = await admin
      .from("positions")
      .select("id")
      .eq("service_id", serviceId)
      .eq("user_id", volunteerId)
      .single();

    const { data, error } = await volunteerClient
      .from("positions")
      .update({ status: "accepted" })
      .eq("id", position!.id)
      .select("status, responded_at")
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("accepted");
    expect(data?.responded_at).not.toBeNull();
  });

  test("a different member cannot modify someone else's position", async () => {
    const { data: position } = await admin
      .from("positions")
      .select("id")
      .eq("service_id", serviceId)
      .eq("user_id", volunteerId)
      .single();

    const { data, error } = await otherVolunteerClient
      .from("positions")
      .update({ status: "declined" })
      .eq("id", position!.id)
      .select();

    // RLS silently filters the row rather than erroring — assert nothing changed.
    expect(error).toBeNull();
    expect(data).toHaveLength(0);

    const { data: unchanged } = await admin
      .from("positions")
      .select("status")
      .eq("id", position!.id)
      .single();
    expect(unchanged?.status).toBe("accepted");
  });

  test("a volunteer can change their own response (accepted -> declined -> accepted)", async () => {
    const { data: position } = await admin
      .from("positions")
      .select("id")
      .eq("service_id", serviceId)
      .eq("user_id", volunteerId)
      .single();

    const { error: declineError } = await volunteerClient
      .from("positions")
      .update({ status: "declined" })
      .eq("id", position!.id);
    expect(declineError).toBeNull();

    const { data: afterDecline } = await admin
      .from("positions")
      .select("status")
      .eq("id", position!.id)
      .single();
    expect(afterDecline?.status).toBe("declined");

    // ...and back again, so the double-booking test below still sees an
    // active (accepted) assignment on this day.
    const { error: reacceptError } = await volunteerClient
      .from("positions")
      .update({ status: "accepted" })
      .eq("id", position!.id);
    expect(reacceptError).toBeNull();

    const { data: afterReaccept } = await admin
      .from("positions")
      .select("status")
      .eq("id", position!.id)
      .single();
    expect(afterReaccept?.status).toBe("accepted");
  });

  test("a volunteer cannot re-open a response back to invited or draft", async () => {
    const { data: position } = await admin
      .from("positions")
      .select("id")
      .eq("service_id", serviceId)
      .eq("user_id", volunteerId)
      .single();

    const { error } = await volunteerClient
      .from("positions")
      .update({ status: "invited" })
      .eq("id", position!.id);

    expect(error).not.toBeNull();
  });

  test("scheduling_conflicts detects a double-booking on the same calendar day", async () => {
    const { data: conflicts } = await schedulerClient.rpc("scheduling_conflicts", {
      p_user_id: volunteerId,
      p_service_id: otherServiceId,
    });

    expect(conflicts?.some((c) => c.conflict_type === "double_booked")).toBe(true);
  });

  test("scheduling_conflicts detects an overlapping blockout date", async () => {
    const { data: service } = await admin
      .from("services")
      .select("starts_at")
      .eq("id", serviceId)
      .single();
    const day = service!.starts_at.slice(0, 10);

    await admin.from("blockout_dates").insert({
      org_id: orgId,
      user_id: otherVolunteerId,
      start_date: day,
      end_date: day,
      reason: "Test blockout",
    });

    const { data: conflicts } = await schedulerClient.rpc("scheduling_conflicts", {
      p_user_id: otherVolunteerId,
      p_service_id: serviceId,
    });

    expect(conflicts?.some((c) => c.conflict_type === "blockout")).toBe(true);
  });

  test("scheduling_conflicts returns nothing when there's no overlap", async () => {
    // unrelatedServiceId is a different calendar day with no position and no
    // blockout coverage for otherVolunteer.
    const { data: conflicts } = await schedulerClient.rpc("scheduling_conflicts", {
      p_user_id: otherVolunteerId,
      p_service_id: unrelatedServiceId,
    });

    expect(conflicts ?? []).toHaveLength(0);
  });
});
