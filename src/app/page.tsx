import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { LandingPage } from "./landing-page";

export default async function Home() {
  const profile = await getCurrentProfile();

  if (!profile) return <LandingPage />;
  if (!profile.org_id) redirect("/onboarding");
  redirect("/dashboard");
}
