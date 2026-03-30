## Centre+

Centre+ is a subscription-backed tuition class management app built with Next.js, Supabase, and Stripe.

### Features

- Username/password login through Supabase Auth
- Centre onboarding and 14-day trial creation
- Batch, student, attendance, and monthly fee management
- Parent portal links for each student
- Stripe Checkout, Billing Portal, and webhook-based subscription syncing
- Branches, staff roles, timetable, tests, risk alerts, and notification outbox

### Setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase and Stripe values.
2. Install the Supabase CLI.
3. Use Node.js `20.9.0` or newer.
4. Install dependencies with `npm install`.
5. For local development, run `npm run supabase:start`.
6. For hosted Supabase, link your project with `npx supabase link`.
7. Push schema with `npm run supabase:db:push`.
8. Generate fresh TypeScript bindings with `npm run supabase:types` if the schema changes.
9. Start the app with `npm run dev`.

### Supabase Production Notes

- The authoritative schema lives in:
  - `supabase/schema.sql`
  - `supabase/migrations/20260324_000001_init.sql`
- Local Supabase project config is in `supabase/config.toml`.
- A trigger auto-creates `public.user_profiles` records for new `auth.users`.
- Centre creation in the app bootstraps:
  - first centre
  - main branch
  - owner membership
  - trial subscription
  - first enrollment form

### Background Jobs

These routes should be called by a scheduler in production:

- Notification dispatch:
  - `GET /api/jobs/notifications?secret=YOUR_CRON_SECRET`
- Risk alerts and fee reminders:
  - `GET /api/jobs/risk-alerts?secret=YOUR_CRON_SECRET`

Recommended schedule:

- notifications: every 1-5 minutes
- risk-alerts: once daily in the morning

### Stripe

- Create two recurring Stripe prices and map them to:
  - `STRIPE_PRICE_STARTER_MONTHLY`
  - `STRIPE_PRICE_STARTER_YEARLY`
- Point your Stripe webhook to `/api/stripe/webhook`
- Subscribe to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### WhatsApp / Notification Provider

- The app queues outbound parent messages in `public.notification_messages`.
- Configure:
  - `WHATSAPP_WEBHOOK_URL`
  - `WHATSAPP_WEBHOOK_TOKEN`
  - `RESEND_API_KEY`
  - `EMAIL_FROM_ADDRESS`
- The dispatcher will POST queued messages to that webhook in a provider-agnostic JSON shape.
- Email notifications are sent through Resend when `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` are set.

### Development Notes

- Next.js 16 requires Node 20.9+.
- The repo uses `proxy.ts` for Supabase session cookie refresh.
- Dashboard access is trial or subscription gated.
- Teacher accounts are limited to attendance, timetable, and tests.
