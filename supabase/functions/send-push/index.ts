import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@types/web-push"
import webpush from "npm:web-push@3.6.7";

export async function handler(req: Request) {
  try {
    // Set VAPID details
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    webpush.setVapidDetails(
      "mailto:admin@equivalent-exchange.com",
      vapidPublicKey,
      vapidPrivateKey
    );
    // Extract JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);

    // Create authenticated client with JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { organizationId, title, body, url, icon, badge } = await req.json();

    if (!organizationId || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is an active admin or owner of the organization
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: "Forbidden - not a member" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Only owners and admins can send push notifications
    if (!["owner", "admin"].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: "Forbidden - insufficient permissions" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get all subscriptions for the organization using service role
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: subscriptions, error: subError } = await serviceSupabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("organization_id", organizationId);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/icons/icon-192x192.png",
      badge: badge || "/icons/icon-192x192.png",
      data: { url: url || "/" },
    });

    // Send notifications to all subscribers
    const results = [];
    for (const sub of subscriptions || []) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        results.push({ id: sub.id, success: true });
      } catch (err: any) {
        console.error(`Failed to send to subscription ${sub.id}:`, err.message);

        // Clean up expired/invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await serviceSupabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }

        results.push({ id: sub.id, success: false, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        total: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
