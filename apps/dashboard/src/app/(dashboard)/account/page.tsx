import { PasskeyManager } from "@eq-ex/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";

export default function AccountPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account security and authentication methods
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Passkeys are a more secure and convenient way to sign in. They use
              biometric authentication (like Face ID or Touch ID) or your
              device&apos;s PIN instead of passwords.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasskeyManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
