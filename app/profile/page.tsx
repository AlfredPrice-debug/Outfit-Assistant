import { auth } from "@/auth";
import { ProfileClient } from "@/components/ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  return <ProfileClient email={session?.user?.email ?? null} />;
}
