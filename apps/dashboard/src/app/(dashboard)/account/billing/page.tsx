import { createClient } from "@eq-ex/shared/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  getStripe,
  getOrCreateStripeCustomerForUser,
} from "@eq-ex/shared/stripe";
import { Button } from "@eq-ex/ui/components/button";

async function getData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, sub: null };
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return { user, sub };
}

export default async function BillingPage() {
  const { user, sub } = await getData();
  if (!user) return <div>Please sign in</div>;

  const isPro = sub && (sub.status === "active" || sub.status === "trialing");

  async function createCheckout() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const base = `${proto}://${host}`;

    const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
    if (!priceId) return;

    const customerId = await getOrCreateStripeCustomerForUser({
      userId: user.id,
      email: user.email ?? null,
    });
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/api/stripe/success`,
      cancel_url: `${base}/account/billing?status=canceled`,
      allow_promotion_codes: true,
    });
    if (session.url) redirect(session.url);
  }

  async function openPortal() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const base = `${proto}://${host}`;

    const customerId = await getOrCreateStripeCustomerForUser({
      userId: user.id,
      email: user.email ?? null,
    });
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/account/billing`,
    });
    if (session.url) redirect(session.url);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <div>Status: {sub?.status ?? "none"}</div>
      {sub?.current_period_end && (
        <div>Renews: {new Date(sub.current_period_end).toLocaleString()}</div>
      )}
      {sub?.payment_brand && (
        <div>
          Card: {sub.payment_brand} •••• {sub.payment_last4}
        </div>
      )}
      <div className="space-x-2">
        {!isPro ? (
          <form action={createCheckout}>
            <Button type="submit">Upgrade to Pro</Button>
          </form>
        ) : (
          <form action={openPortal}>
            <Button type="submit">Manage Billing</Button>
          </form>
        )}
      </div>
    </div>
  );
}
