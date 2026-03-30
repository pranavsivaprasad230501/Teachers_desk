import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().min(1).optional()
);

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().url().optional()
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString,
  STRIPE_SECRET_KEY: optionalNonEmptyString,
  STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  STRIPE_PRICE_STARTER_MONTHLY: optionalNonEmptyString,
  STRIPE_PRICE_STARTER_YEARLY: optionalNonEmptyString,
  APP_URL: optionalUrl,
  WHATSAPP_WEBHOOK_URL: optionalUrl,
  WHATSAPP_WEBHOOK_TOKEN: optionalNonEmptyString,
  CRON_SECRET: optionalNonEmptyString,
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  STRIPE_PRICE_STARTER_YEARLY: process.env.STRIPE_PRICE_STARTER_YEARLY,
  APP_URL: process.env.APP_URL,
  WHATSAPP_WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL,
  WHATSAPP_WEBHOOK_TOKEN: process.env.WHATSAPP_WEBHOOK_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
});

export function getAppUrl() {
  return serverEnv.APP_URL ?? "http://localhost:3002";
}

export function requireServerEnv<T extends keyof typeof serverEnv>(
  key: T
): NonNullable<(typeof serverEnv)[T]> {
  const value = serverEnv[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value as NonNullable<(typeof serverEnv)[T]>;
}
