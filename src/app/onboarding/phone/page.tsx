import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOrgProfile } from "@/lib/auth/current-user";
import { CardSticker } from "@/components/shared/card-sticker";
import { PhoneForm } from "./phone-form";

export default async function PhoneOnboardingPage() {
  const profile = await requireOrgProfile();
  if (profile.phone) redirect("/dashboard");

  return (
    <div className="mx-auto grid max-w-md gap-4 px-4 py-16">
      <div>
        <CardSticker src="/mascot/full/boy_headset_walkie.png" />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Add your mobile number</CardTitle>
            <CardDescription>
              Your team uses this to reach you about scheduling — we need it on
              file before you can continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhoneForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
