import { PLAN_DETAILS } from "@/lib/plans";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser } from "@/lib/data";
import { SectionHero } from "@/components/dashboard/section-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { AccessDenied } from "@/components/dashboard/access-denied";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string;
    billing?: string;
    error?: string;
  }>;
}) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  const centre = appContext.centre;
  const params = await searchParams;

  if (!centre) {
    return <CreateCentreForm />;
  }
  if (appContext.role === "teacher") {
    return <AccessDenied description="Teachers do not manage subscriptions or Stripe billing." />;
  }

  const subscription = appContext.subscription;
  if (!subscription) {
    return <CreateCentreForm />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <SectionHero
          eyebrow="Billing Experience"
          title="Wrap plan management in a cleaner, more premium visual layer."
          description="Subscription controls are still direct, but this page now opens with an illustration that makes billing feel more trustworthy and polished."
          imageSrc="/operations-scene.svg"
          imageAlt="Illustration of operational settings and subscription management panels"
          tone="amber"
        />
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>
              Manage your plan, start checkout, or open the Stripe billing portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.checkout === "success" ? (
              <Banner
                tone="success"
                message="Checkout completed. Billing status will update after Stripe confirms the subscription."
              />
            ) : null}
            {params.checkout === "cancelled" ? (
              <Banner
                tone="warning"
                message="Checkout was cancelled. Your current plan remains unchanged."
              />
            ) : null}
            {params.billing === "returned" ? (
              <Banner
                tone="neutral"
                message="Returned from the billing portal. Refresh if you just changed your subscription."
              />
            ) : null}
            {params.error ? (
              <Banner
                tone="error"
                message={getBillingErrorMessage(params.error)}
              />
            ) : null}
            <div className="rounded-lg border p-4 text-sm">
              <p className="font-medium text-slate-900">Current status</p>
              <p className="mt-1 capitalize text-muted-foreground">{subscription.status}</p>
              <p className="mt-1 text-muted-foreground">
                Trial ends: {formatDate(subscription.trial_ends_at)}
              </p>
              <p className="mt-1 text-muted-foreground">
                Current period end: {formatDate(subscription.current_period_end)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <form action="/api/stripe/checkout" method="post">
                <input type="hidden" name="plan_key" value="starter_monthly" />
                <SubmitButton type="submit" pendingLabel="Redirecting...">
                  Subscribe Monthly
                </SubmitButton>
              </form>
              <form action="/api/stripe/checkout" method="post">
                <input type="hidden" name="plan_key" value="starter_yearly" />
                <SubmitButton type="submit" variant="outline" pendingLabel="Redirecting...">
                  Subscribe Yearly
                </SubmitButton>
              </form>
              <form action="/api/stripe/portal" method="post">
                <SubmitButton type="submit" variant="ghost" pendingLabel="Opening...">
                  Open Billing Portal
                </SubmitButton>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Configured Stripe products used by this application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
            <div key={key} className="rounded-lg border p-4 text-sm">
              <p className="font-medium text-slate-900">{plan.label}</p>
              <p className="mt-1 text-muted-foreground">{plan.amountLabel}</p>
              <p className="mt-1 text-muted-foreground">{plan.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Banner({
  tone,
  message,
}: {
  tone: "success" | "warning" | "error" | "neutral";
  message: string;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-800",
  };

  return <div className={`rounded-lg border p-3 text-sm ${styles[tone]}`}>{message}</div>;
}

function getBillingErrorMessage(errorCode: string) {
  switch (errorCode) {
    case "invalid_plan":
      return "The selected plan is invalid.";
    case "checkout_failed":
      return "Unable to start Stripe checkout.";
    case "portal_failed":
      return "Unable to open the Stripe billing portal.";
    default:
      return "Billing action failed.";
  }
}
