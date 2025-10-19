import { getUser, PasskeyManager } from "@eq-ex/auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PushSubscription from "../../components/PushSubscription";
import { redirect } from "next/navigation";

export default async function Settings() {
  const user = await getUser().catch((e) => null);

  if (!user) {
    redirect(`/auth/login`);
  }
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and authentication methods
          </p>
        </div>

        <PasskeyManager />
        <PushSubscription />
      </div>
    </div>
  );
}
