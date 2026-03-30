import Stripe from "stripe";

import type { Json } from "@/lib/database.types";
import { requireServerEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { recordPaymentEvent, syncSubscriptionFromStripe } from "@/lib/billing";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      requireServerEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Invalid webhook signature",
      {
        status: 400,
      }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const centreId = session.metadata?.centre_id;
      if (centreId) {
        await recordPaymentEvent({
          centreId,
          stripeEventId: event.id,
          eventType: event.type,
          payload: JSON.parse(JSON.stringify(session)) as Json,
        });
      }
      if (typeof session.subscription === "string") {
        await syncSubscriptionFromStripe(session.subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const centreId = subscription.metadata.centre_id;
      if (centreId) {
        await recordPaymentEvent({
          centreId,
          stripeEventId: event.id,
          eventType: event.type,
          payload: JSON.parse(JSON.stringify(subscription)) as Json,
        });
      }
      await syncSubscriptionFromStripe(subscription.id);
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
