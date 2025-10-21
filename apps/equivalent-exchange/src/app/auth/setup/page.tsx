import { createClient } from "@eq-ex/shared/server";
import { PasskeySetupWrapper } from "../../../components/passkey-setup-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle>Account Setup</CardTitle>
              <CardDescription>Please verify your email first</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                We couldn&apos;t find an active session. Please check your email
                for the confirmation link and click it to continue setting up
                your account.
              </p>
              <Link href="/auth/sign-up" className="underline">
                Back to sign up
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Secure your account</CardTitle>
              <CardDescription>
                Add a passkey for passwordless sign-in (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasskeySetupWrapper />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
