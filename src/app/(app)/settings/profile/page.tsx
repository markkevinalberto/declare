import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { ProfileForm } from "./profile-form";

export default async function ProfileSettingsPage() {
  const profile = await requireOrgProfile();

  return (
    <div className="grid max-w-md gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultName={profile.name} defaultPhone={profile.phone ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
