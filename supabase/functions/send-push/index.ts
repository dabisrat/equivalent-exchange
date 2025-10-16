import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import { createClient } from "npm:@supabase/supabase-js@2";
// import * as webpush from "jsr:@negrel/webpush";
import { createClient } from "supabase";
import * as webpush from "webpush";

// CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationPayload {
  organizationId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  organization_id: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

Deno.serve(async (req) => {
  console.log(
    `[${new Date().toISOString()}] Push notification request received: ${req.method} ${req.url}`
  );

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(
      `[${new Date().toISOString()}] Handling CORS preflight request`
    );
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log(`[${new Date().toISOString()}] Missing authorization header`);
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${new Date().toISOString()}] Authorization header present`);

    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.log(
        `[${new Date().toISOString()}] Authentication failed:`,
        userError?.message || "No user"
      );
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${new Date().toISOString()}] User authenticated: ${user.id}`);

    // Parse request body
    const payload: PushNotificationPayload = await req.json();
    const { organizationId, title, body, icon, badge, url } = payload;

    console.log(`[${new Date().toISOString()}] Request payload:`, {
      organizationId,
      title,
      body,
      icon,
      badge,
      url,
      hasAuth: !!authHeader,
    });

    // Validate required fields
    if (!organizationId || !title || !body) {
      console.log(
        `[${new Date().toISOString()}] Missing required fields: organizationId=${!!organizationId}, title=${!!title}, body=${!!body}`
      );
      return new Response(
        JSON.stringify({
          error: "Missing required fields: organizationId, title, body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this organization
    const { data: membership, error: membershipError } = await supabaseClient
      .from("organization_members")
      .select("role")
      .eq("is_active", true)
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      console.log(
        `[${new Date().toISOString()}] Organization access denied for user ${user.id} in org ${organizationId}:`,
        membershipError?.message || "No membership found"
      );
      return new Response(
        JSON.stringify({
          error: "User does not have access to this organization",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["owner", "admin"].includes(membership.role)) {
      return new Response(
        JSON.stringify({
          error: "User does not have access to this organization",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[${new Date().toISOString()}] User ${user.id} has access to organization ${organizationId}`
    );

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject =
      Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error(`[${new Date().toISOString()}] VAPID keys not configured`);
      return new Response(
        JSON.stringify({
          error: "Push notifications not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Set VAPID details for the web-push library
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    console.log(
      `[${new Date().toISOString()}] VAPID keys configured, subject: ${vapidSubject}`
    );

    // Fetch all push subscriptions for this organization
    const { data: subscriptions, error: subscriptionsError } =
      await supabaseClient
        .from("push_subscriptions")
        .select("*")
        .eq("organization_id", organizationId);

    if (subscriptionsError) {
      console.error(
        `[${new Date().toISOString()}] Error fetching subscriptions for org ${organizationId}:`,
        subscriptionsError
      );
      return new Response(
        JSON.stringify({
          error: "Failed to fetch subscriptions",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[${new Date().toISOString()}] Found ${subscriptions?.length || 0} subscriptions for organization ${organizationId}`
    );

    if (!subscriptions || subscriptions.length === 0) {
      console.log(
        `[${new Date().toISOString()}] No subscriptions found for organization ${organizationId}`
      );
      return new Response(
        JSON.stringify({
          message: "No subscriptions found for this organization",
          sentCount: 0,
          failedCount: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon || "/icon-192x192.png",
      badge: badge || "/badge-72x72.png",
      data: {
        url: url || "/",
        organizationId,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Prepared notification payload, starting to send to ${subscriptions.length} subscriptions`
    );

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: PushSubscription) => {
        console.log("sub object:", sub);
        try {
          const pushSubscription = {
            endpoint: sub.subscription.endpoint,
            keys: {
              p256dh: sub.subscription.keys.p256dh,
              auth: sub.subscription.keys.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, notificationPayload);

          console.log(
            `[${new Date().toISOString()}] Successfully sent notification to subscription ${sub.id} (user: ${sub.user_id})`
          );
          return { success: true, subscriptionId: sub.id };
        } catch (error) {
          console.error(
            `[${new Date().toISOString()}] Failed to send notification to subscription ${sub.id} (user: ${sub.user_id}):`,
            error
          );

          // If subscription is expired or invalid, delete it
          if (
            error instanceof Error &&
            (error.message.includes("410") || error.message.includes("404"))
          ) {
            console.log(
              `[${new Date().toISOString()}] Deleting expired subscription ${sub.id}`
            );
            await supabaseClient
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }

          return {
            success: false,
            subscriptionId: sub.id,
            error: error.message,
          };
        }
      })
    );

    // Count successes and failures
    const sentCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failedCount = results.length - sentCount;

    console.log(
      `[${new Date().toISOString()}] Push notification batch completed: ${sentCount} sent, ${failedCount} failed, ${subscriptions.length} total`
    );

    return new Response(
      JSON.stringify({
        message: "Push notifications sent",
        sentCount,
        failedCount,
        totalSubscriptions: subscriptions.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Unexpected error in push notification function:`,
      error
    );
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
