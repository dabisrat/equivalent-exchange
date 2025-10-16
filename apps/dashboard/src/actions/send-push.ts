"use server";

import { createClient as createServerClient } from "@eq-ex/shared/server";

interface SendPushParams {
  organizationId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

export async function sendPush({
  organizationId,
  title,
  body,
  icon,
  badge,
  url,
}: SendPushParams) {
  try {
    const supabase = await createServerClient();

    // Get the current session to pass JWT to Edge Function
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error("Not authenticated");
    }
    // Call the Edge Function with JWT authentication
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: { organizationId, title, body, icon, badge, url },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error("Edge Function error:", error);
      throw new Error(`Failed to send push notifications: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    throw error;
  }
}
