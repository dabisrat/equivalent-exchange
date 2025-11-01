import { OrganizationAdminRoute } from "@app/components/organization-admin-route";

import NotificationsForm from "@app/components/notifications-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";

export default async function NotificationsPage() {
  return (
    <OrganizationAdminRoute>
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <Card>
          <CardHeader>
            <CardTitle>Send Push Notifications</CardTitle>
            <CardDescription>
              {/* Customize the appearance of your Google Wallet loyalty passes. */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsForm />
          </CardContent>
        </Card>
      </main>
    </OrganizationAdminRoute>
  );
}
