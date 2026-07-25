"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type JoinState = { error?: string } | undefined;

export async function joinByToken(
  _prevState: JoinState,
  formData: FormData
): Promise<JoinState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Missing join token." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_org_by_token", {
    p_token: token,
  });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
