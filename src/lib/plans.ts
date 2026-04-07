import { requireServerEnv } from "@/lib/env";

export type PlanKey = "starter_monthly" | "starter_yearly";

export const PLAN_DETAILS: Record<
  PlanKey,
  {
    label: string;
    cadence: "month" | "year";
    amountLabel: string;
    description: string;
    priceEnvKey:
      | "STRIPE_PRICE_STARTER_MONTHLY"
      | "STRIPE_PRICE_STARTER_YEARLY";
  }
> = {
  starter_monthly: {
    label: "Starter Monthly",
    cadence: "month",
    amountLabel: "Rs 1,499 / month",
    description: "Run one centre with attendance, fees, parent portal, and billing.",
    priceEnvKey: "STRIPE_PRICE_STARTER_MONTHLY",
  },
  starter_yearly: {
    label: "Starter Yearly",
    cadence: "year",
    amountLabel: "Rs 14,990 / year",
    description:
      "Annual plan for one centre with lower effective monthly pricing.",
    priceEnvKey: "STRIPE_PRICE_STARTER_YEARLY",
  },
};

export function getPriceIdForPlan(planKey: PlanKey) {
  return requireServerEnv(PLAN_DETAILS[planKey].priceEnvKey);
}

export function isPlanConfigured(planKey: PlanKey) {
  return Boolean(process.env[PLAN_DETAILS[planKey].priceEnvKey]);
}

export function getPlanFromPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) {
    return null;
  }

  const entries = Object.entries(PLAN_DETAILS) as Array<
    [PlanKey, (typeof PLAN_DETAILS)[PlanKey]]
  >;
  const match = entries.find(([, plan]) => {
    const configuredPriceId = process.env[plan.priceEnvKey];
    return configuredPriceId ? configuredPriceId === priceId : false;
  });
  return match?.[0] ?? null;
}
