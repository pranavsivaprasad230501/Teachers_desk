import { ArrowRight, CheckCircle2, CreditCard, Mail, MessageSquare, XCircle } from "lucide-react";

import { PLAN_DETAILS } from "@/lib/plans";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser } from "@/lib/data";
import { serverEnv } from "@/lib/env";
import { SectionHero } from "@/components/dashboard/section-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { AccessDenied } from "@/components/dashboard/access-denied";

function getDaysRemaining(trialEndsAt?: string | null) {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const PLAN_FEATURES = [
  "Unlimited students & batches",
  "Attendance & timetable management",
  "Fee collection & overdue tracking",
  "Parent WhatsApp & email alerts",
  "Test marks & progress tracking",
  "Multi-branch operations",
  "Student parent portal",
  "Risk alerts & low-attendance flags",
];

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

  const daysRemaining = getDaysRemaining(subscription.trial_ends_at);
  const isTrialing = subscription.status === "trialing";
  const isActive = subscription.status === "active";

  const stripeConfigured = Boolean(serverEnv.STRIPE_SECRET_KEY);
  const emailConfigured = Boolean(serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM_ADDRESS);
  const whatsappConfigured = Boolean(serverEnv.WHATSAPP_WEBHOOK_URL && serverEnv.WHATSAPP_WEBHOOK_TOKEN);

  return (
    <div className="space-y-6">
      <SectionHero
        eyebrow="Billing & Notifications"
        title="Manage your subscription and communication providers."
        description="Subscribe to keep your centre running, and connect Resend and WhatsApp to start sending automated parent notifications."
        imageSrc="/operations-scene.svg"
        imageAlt="Illustration of operational settings and subscription management panels"
        tone="amber"
      />

      {/* Notification banners */}
      {params.checkout === "success" && (
        <Banner tone="success" message="Checkout completed. Your subscription will activate once Stripe confirms the payment." />
      )}
      {params.checkout === "cancelled" && (
        <Banner tone="warning" message="Checkout was cancelled. Your current plan remains unchanged." />
      )}
      {params.billing === "returned" && (
        <Banner tone="neutral" message="Returned from the billing portal. Refresh if you just made changes." />
      )}
      {params.error && (
        <Banner tone="error" message={getBillingErrorMessage(params.error)} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Current subscription status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and billing status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`rounded-2xl border p-4 ${isActive ? "border-emerald-200 bg-emerald-50" : isTrialing ? "border-sky-200 bg-sky-50" : "border-rose-200 bg-rose-50"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isActive ? "text-emerald-700" : isTrialing ? "text-sky-700" : "text-rose-700"}`}>
                    {isActive ? "Active" : isTrialing ? "Trial" : subscription.status}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 capitalize">
                    {subscription.plan_key ? PLAN_DETAILS[subscription.plan_key as keyof typeof PLAN_DETAILS]?.label ?? "Starter" : "Free Trial"}
                  </p>
                </div>
                {isTrialing && daysRemaining !== null && (
                  <div className="rounded-xl bg-white/80 px-3 py-2 text-center shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">{daysRemaining}</p>
                    <p className="text-xs text-slate-500">days left</p>
                  </div>
                )}
              </div>
              {isTrialing && (
                <p className="mt-2 text-sm text-sky-700">
                  Trial ends {formatDate(subscription.trial_ends_at)}
                </p>
              )}
              {isActive && (
                <p className="mt-2 text-sm text-emerald-700">
                  Renews {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {!isActive && (
                <>
                  <form action="/api/stripe/checkout" method="post">
                    <input type="hidden" name="plan_key" value="starter_monthly" />
                    <SubmitButton
                      type="submit"
                      pendingLabel="Redirecting..."
                      className="inline-flex items-center gap-2 rounded-full bg-[#f47c20] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,124,32,0.28)] hover:bg-[#e56b0c]"
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscribe Monthly
                      <ArrowRight className="h-4 w-4" />
                    </SubmitButton>
                  </form>
                  <form action="/api/stripe/checkout" method="post">
                    <input type="hidden" name="plan_key" value="starter_yearly" />
                    <SubmitButton type="submit" variant="outline" pendingLabel="Redirecting...">
                      Subscribe Yearly (save 17%)
                    </SubmitButton>
                  </form>
                </>
              )}
              {(isActive || stripeConfigured) && (
                <form action="/api/stripe/portal" method="post">
                  <SubmitButton type="submit" variant="ghost" pendingLabel="Opening...">
                    Open Billing Portal
                  </SubmitButton>
                </form>
              )}
            </div>

            {!stripeConfigured && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Stripe not configured.</strong> Add <code className="font-mono">STRIPE_SECRET_KEY</code>, <code className="font-mono">STRIPE_WEBHOOK_SECRET</code>, and both price IDs to your <code className="font-mono">.env.local</code> to enable paid subscriptions. Get your keys at{" "}
                <span className="font-semibold">dashboard.stripe.com → Developers → API Keys</span>.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan comparison */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s included</CardTitle>
            <CardDescription>Every plan includes all features — only the billing cadence differs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {PLAN_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-2 grid gap-3">
              {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
                <div key={key} className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-900">{plan.label}</span>
                  <span className="font-bold text-slate-700">{plan.amountLabel}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification providers */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Providers</CardTitle>
          <CardDescription>
            Configure these to enable automated parent alerts for fees, attendance, tests, and broadcasts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ProviderCard
            icon={Mail}
            title="Email (Resend)"
            configured={emailConfigured}
            configuredLabel="Email delivery is active"
            unconfiguredLabel="Add RESEND_API_KEY and EMAIL_FROM_ADDRESS to .env.local"
            setupSteps={[
              "Sign up at resend.com (free tier: 3,000 emails/month)",
              "Create an API key at resend.com/api-keys",
              "Add a verified sender domain or use the sandbox sender",
              'Set RESEND_API_KEY=re_xxxx and EMAIL_FROM_ADDRESS=noreply@yourdomain.com',
            ]}
          />
          <ProviderCard
            icon={MessageSquare}
            title="WhatsApp (Webhook)"
            configured={whatsappConfigured}
            configuredLabel="WhatsApp delivery is active"
            unconfiguredLabel="Add WHATSAPP_WEBHOOK_URL and WHATSAPP_WEBHOOK_TOKEN to .env.local"
            setupSteps={[
              "Use Twilio, Interakt, Wati, or any WhatsApp Business API provider",
              "Get your webhook endpoint URL and bearer token from your provider dashboard",
              "Set WHATSAPP_WEBHOOK_URL=https://api.yourprovider.com/send",
              "Set WHATSAPP_WEBHOOK_TOKEN=your_bearer_token",
            ]}
          />
        </CardContent>
      </Card>

      {/* Cron job guide */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Notifications</CardTitle>
          <CardDescription>
            Two background jobs run daily to queue and dispatch notifications. On Vercel they run automatically via cron. In development, trigger them manually below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Risk & reminder queue</p>
              <p className="mt-1 text-muted-foreground">Runs daily at 7:00 AM IST — queues fee reminders, test alerts, class reminders, and holiday notices.</p>
              <a href="/api/jobs/risk-alerts?run=1" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:underline">
                Run manually <ArrowRight className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Notification dispatch</p>
              <p className="mt-1 text-muted-foreground">Runs every 15 minutes — sends queued messages via email and WhatsApp. Marks each as sent or failed.</p>
              <a href="/api/jobs/notifications?run=1" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:underline">
                Run manually <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            On Vercel: set <code className="font-mono text-xs">CRON_SECRET</code> in your project environment variables to protect these endpoints. Vercel cron jobs send this automatically as an Authorization header.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProviderCard({
  icon: Icon,
  title,
  configured,
  configuredLabel,
  unconfiguredLabel,
  setupSteps,
}: {
  icon: React.ElementType;
  title: string;
  configured: boolean;
  configuredLabel: string;
  unconfiguredLabel: string;
  setupSteps: string[];
}) {
  return (
    <div className={`rounded-2xl border p-5 ${configured ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${configured ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="font-semibold text-slate-900">{title}</p>
        </div>
        {configured ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <XCircle className="h-5 w-5 text-slate-300" />
        )}
      </div>
      <p className={`mt-3 text-sm ${configured ? "text-emerald-700" : "text-muted-foreground"}`}>
        {configured ? configuredLabel : unconfiguredLabel}
      </p>
      {!configured && (
        <ol className="mt-3 space-y-1.5">
          {setupSteps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-600">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                {i + 1}
              </span>
              <code className="font-mono leading-5">{step}</code>
            </li>
          ))}
        </ol>
      )}
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

  return <div className={`rounded-xl border p-3 text-sm ${styles[tone]}`}>{message}</div>;
}

function getBillingErrorMessage(errorCode: string) {
  switch (errorCode) {
    case "invalid_plan":
      return "The selected plan is invalid.";
    case "checkout_failed":
      return "Unable to start Stripe checkout. Make sure STRIPE_SECRET_KEY and price IDs are configured.";
    case "portal_failed":
      return "Unable to open the Stripe billing portal.";
    default:
      return "Billing action failed.";
  }
}
