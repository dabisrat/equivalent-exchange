import Stripe from "stripe";
import { createClient, supabaseAdmin } from "./server";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeSingleton) return stripeSingleton;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("Missing STRIPE_SECRET_KEY");
  // Let the SDK use its bundled API version to avoid TS literal mismatches.
  stripeSingleton = new Stripe(apiKey);
  return stripeSingleton;
}

type SyncResult =
  | { status: "none" }
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      paymentMethod: { brand: string | null; last4: string | null } | null;
    };

export async function getOrCreateStripeCustomerForUser(params: {
  userId: string;
  email: string | null;
}): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: params.email ?? undefined,
    metadata: { userId: params.userId },
  });

  await supabaseAdmin.from("user_subscriptions").upsert(
    {
      user_id: params.userId,
      stripe_customer_id: customer.id,
      status: "none",
    },
    { onConflict: "user_id" }
  );

  return customer.id;
}

export async function mapCustomerToUser(
  customerId: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

export async function syncStripeDataForCustomer(
  customerId: string
): Promise<SyncResult> {
  const stripe = getStripe();

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: "all",
    expand: ["data.default_payment_method"],
  });

  if (subs.data.length === 0) {
    // No active subscription; store none if we can map user
    const userId = await mapCustomerToUser(customerId);
    if (userId) {
      await supabaseAdmin
        .from("user_subscriptions")
        .upsert(
          { user_id: userId, stripe_customer_id: customerId, status: "none" },
          { onConflict: "user_id" }
        );
    }
    return { status: "none" };
  }

  const sub = subs.data[0];
  const priceId = sub.items.data[0]?.price?.id ?? null;

  const payment =
    sub.default_payment_method && typeof sub.default_payment_method !== "string"
      ? {
          brand: sub.default_payment_method.card?.brand ?? null,
          last4: sub.default_payment_method.card?.last4 ?? null,
        }
      : null;

  const snapshot: SyncResult = {
    subscriptionId: sub.id,
    status: sub.status,
    priceId,
    currentPeriodStart: (sub as any).current_period_start ?? null,
    currentPeriodEnd: (sub as any).current_period_end ?? null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    paymentMethod: payment,
  };

  const userId = await mapCustomerToUser(customerId);
  if (userId) {
    await supabaseAdmin.from("user_subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status: sub.status,
        price_id: priceId,
        current_period_start: new Date(
          (((sub as any).current_period_start ?? 0) as number) * 1000
        ).toISOString(),
        current_period_end: new Date(
          (((sub as any).current_period_end ?? 0) as number) * 1000
        ).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        payment_brand: payment?.brand ?? null,
        payment_last4: payment?.last4 ?? null,
      },
      { onConflict: "user_id" }
    );
  }

  return snapshot;
}
