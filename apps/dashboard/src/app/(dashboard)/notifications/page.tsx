"use client";

import { useState } from "react";
import { sendPush } from "../../../data-access/actions/send-push";
import { useMultiOrgContext } from "../../../contexts/multi-org-context";
import { Button } from "@eq-ex/ui/components/button";
import { Input } from "@eq-ex/ui/components/input";
import { Label } from "@eq-ex/ui/components/label";

export default function NotificationsPage() {
  const { activeOrganization } = useMultiOrgContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeOrganization) {
      setMessage("No active organization selected");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      const title = formData.get("title") as string;
      const body = formData.get("body") as string;
      const url = formData.get("url") as string;
      const icon = activeOrganization.logo_url || "/icons/icon-192x192.png";
      const badge = activeOrganization.logo_url || "/icons/icon-192x192.png";

      if (!title || !body) {
        setMessage("Title and body are required");
        return;
      }

      await sendPush({
        organizationId: activeOrganization.id,
        title,
        body,
        icon,
        badge,
        url,
      });

      setMessage("Push notification sent successfully!");
    } catch (error) {
      console.error("Error sending push:", error);
      setMessage("Failed to send push notification");
    } finally {
      setLoading(false);
    }
  };

  if (!activeOrganization) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div>Please select an organization</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="border rounded-lg p-4 max-w-md">
        <h3 className="text-lg font-semibold mb-4">Send Push Notification</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <Input id="body" name="body" required />
          </div>
          {/* <div>
            <Label htmlFor="url">URL (optional)</Label>
            <Input id="url" name="url" placeholder="/" />
          </div> */}
          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </form>
        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
}
