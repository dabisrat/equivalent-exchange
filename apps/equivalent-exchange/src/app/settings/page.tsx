import { PasskeyManager } from "@eq-ex/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Settings() {
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
