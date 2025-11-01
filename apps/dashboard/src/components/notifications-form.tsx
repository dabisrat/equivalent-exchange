"use client";

import { useState } from "react";
import { sendPush } from "@app/data-access/actions/send-push";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { Button } from "@eq-ex/ui/components/button";
import { Input } from "@eq-ex/ui/components/input";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@eq-ex/ui/components/form";

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "message is required"),
  url: z.string().url().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function NotificationsForm() {
  const { activeOrganization } = useMultiOrgContext();
  const [message, setMessage] = useState("");

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      message: "",
      url: undefined,
    },
  });

  const handleSubmit = async (data: NotificationFormData) => {
    console.log("Form submitted with data:", data);
    if (!activeOrganization) {
      setMessage("No active organization selected");
      return;
    }
    setMessage("");

    try {
      const title = data.title;
      const message = data.message;
      const url = data.url || "";
      const icon = activeOrganization.logo_url || "/icons/icon-192x192.png";
      const badge = activeOrganization.logo_url || "/icons/icon-192x192.png";

      if (!title || !message) {
        setMessage("Title and message are required");
        return;
      }

      await sendPush({
        organizationId: activeOrganization.id,
        body: message,
        title,
        icon,
        badge,
        url,
      });

      setMessage("Push notification sent successfully!");
    } catch (error) {
      console.error("Error sending push:", error);
      setMessage("Failed to send push notification");
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Notification Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Input placeholder="Notification Message" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending..." : "Send Notification"}
          </Button>
        </form>
      </Form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
