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
        <PasskeyManager />
      </div>
    </div>
  );
}
