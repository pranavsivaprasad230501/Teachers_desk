import type { Json } from "@/lib/database.types";
import { getAppUrl } from "@/lib/env";
import { getPlanFromPriceId, getPriceIdForPlan, type PlanKey } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { CentreRecord, SubscriptionStatus } from "@/lib/types";

export async function getOrCreateStripeCustomer(
  centre: CentreRecord,
  email?: string | null
) {
  const supabase = createAdminSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("centre_id", centre.id)
    .limit(1)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: centre.name,
    phone: centre.phone ?? undefined,
    email: email ?? undefined,
    metadata: {
      centre_id: centre.id,
    },
  });

  const { error } = await supabase
    .from("subscriptions")
    .update({
      stripe_customer_id: customer.id,
    })
    .eq("centre_id", centre.id);

  if (error) {
    throw new Error(error.message);
  }

  return customer.id;
}

export async function createCheckoutUrl(args: {
  centre: CentreRecord;
  email?: string | null;
  planKey: PlanKey;
}) {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(args.centre, args.email);
  const priceId = getPriceIdForPlan(args.planKey);
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      centre_id: args.centre.id,
      plan_key: args.planKey,
    },
    subscription_data: {
      metadata: {
        centre_id: args.centre.id,
        plan_key: args.planKey,
      },
    },
    success_url: `${appUrl}/dashboard/settings?checkout=success`,
    cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a URL.");
  }

  return session.url;
}

export async function createBillingPortalUrl(args: {
  centre: CentreRecord;
  email?: string | null;
}) {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(args.centre, args.email);
  const appUrl = getAppUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/settings?billing=returned`,
  });

  return session.url;
}

export async function syncSubscriptionFromStripe(subscriptionId: string) {
  const stripe = getStripe();
  const supabase = createAdminSupabaseClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const centreId =
    subscription.metadata.centre_id ??
    (typeof subscription.customer === "object" && !subscription.customer.deleted
      ? subscription.customer.metadata.centre_id
      : undefined);

  if (!centreId) {
    return;
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      centre_id: centreId,
      status: subscription.status as SubscriptionStatus,
      plan_key: getPlanFromPriceId(priceId),
      stripe_customer_id:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_end: new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    },
    {
      onConflict: "centre_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordPaymentEvent(args: {
  centreId: string;
  stripeEventId: string;
  eventType: string;
  payload: Json;
}) {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("payment_events").upsert(
    {
      centre_id: args.centreId,
      stripe_event_id: args.stripeEventId,
      event_type: args.eventType,
      payload: args.payload,
    },
    {
      onConflict: "stripe_event_id",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}
