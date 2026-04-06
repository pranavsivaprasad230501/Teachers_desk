# Teachers Desk — Environment Setup & Feature Testing Guide

## Overview

This guide covers how to get all keys, configure your `.env.local`, and test every feature:
- **Billing** (Stripe subscriptions)
- **Email notifications** (Resend)
- **WhatsApp notifications** (generic webhook)
- **Cron jobs** (automated reminders)

---

## Step 1 — Create `.env.local`

Create a file called `.env.local` in the root of the project with the following:

```env
# ── Supabase (already have these) ─────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── App ────────────────────────────────────────────────────────────────────────
APP_URL=http://localhost:3000

# ── Stripe ─────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_STARTER_YEARLY=

# ── Email (Resend) ─────────────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=

# ── WhatsApp ───────────────────────────────────────────────────────────────────
WHATSAPP_WEBHOOK_URL=
WHATSAPP_WEBHOOK_TOKEN=

# ── Cron jobs ──────────────────────────────────────────────────────────────────
CRON_SECRET=
```

Fill each value in as you follow the steps below.

---

## Step 2 — Supabase Keys

1. Open your project at **[supabase.com/dashboard](https://supabase.com/dashboard)**
2. Go to **Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (⚠️ keep this secret — never expose to the browser) → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 3 — Stripe (Billing & Subscriptions)

### 3a. Get your Secret Key

1. Go to **[dashboard.stripe.com](https://dashboard.stripe.com)** → create an account if needed
2. Make sure the **Test mode** toggle (top-left) is ON while setting up
3. Go to **Developers → API keys**
4. Copy the **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`

### 3b. Create the two subscription prices

1. Go to **Products → Add product**
2. Name it **"Starter"**
3. Add a price:
   - Amount: **1499** · Currency: **INR** · Recurring: **Monthly**
   - Click Save → copy the **Price ID** (`price_xxx`) → `STRIPE_PRICE_STARTER_MONTHLY`
4. Add another price to the same product:
   - Amount: **14990** · Currency: **INR** · Recurring: **Yearly**
   - Click Save → copy the **Price ID** → `STRIPE_PRICE_STARTER_YEARLY`

### 3c. Get the Webhook Secret

**For local development (recommended first):**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will print:
```
Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```
Use that as `STRIPE_WEBHOOK_SECRET`.

**For production (Vercel):**

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://yourapp.vercel.app/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint** → copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

---

## Step 4 — Email via Resend

1. Sign up at **[resend.com](https://resend.com)** (free tier: 3,000 emails/month)
2. Go to **API Keys → Create API Key** → copy it → `RESEND_API_KEY`
3. Go to **Domains → Add Domain** → enter your domain → verify the DNS records shown (takes a few minutes)
4. Once verified, set:
   ```
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```

> **No domain yet?** Use `EMAIL_FROM_ADDRESS=onboarding@resend.dev` temporarily.
> This only sends to the single email address you verified in your Resend account — good for initial testing.

---

## Step 5 — WhatsApp Notifications

Your app uses a **provider-agnostic webhook** — any service that accepts a POST request works.

### Option A — WATI (recommended for India)

1. Sign up at **[wati.io](https://wati.io)** → connect your WhatsApp Business number
2. Go to **Settings → API**
3. Copy the **API endpoint URL** → `WHATSAPP_WEBHOOK_URL`
4. Copy the **Bearer token** → `WHATSAPP_WEBHOOK_TOKEN`

### Option B — Twilio WhatsApp Sandbox (free for testing)

1. Sign up at **[console.twilio.com](https://console.twilio.com)**
2. Go to **Messaging → Try it out → Send a WhatsApp message** → follow sandbox setup
3. Use `https://api.twilio.com/2010-04-01/Accounts/{YOUR_ACCOUNT_SID}/Messages.json` → `WHATSAPP_WEBHOOK_URL`
4. Use your **Auth Token** → `WHATSAPP_WEBHOOK_TOKEN`

> WhatsApp is fully optional. If you skip it, email notifications still work fine. The app checks whether the keys are configured and shows status on the Messages page.

---

## Step 6 — Cron Secret

Generate a random secret to protect the cron job endpoints:

```bash
openssl rand -hex 32
```

Paste the output as `CRON_SECRET`.

---

## Step 7 — Test Everything Locally

Start your dev server:
```bash
npm run dev
```

In a **separate terminal**, start the Stripe webhook listener:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Test Billing

1. Log in → go to **Dashboard → Settings**
2. Click **Subscribe** on one of the plans
3. Use Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/29`)
   - CVC: any 3 digits
4. Complete checkout → you should be redirected back to Settings
5. Settings page should now show subscription status as **active**
6. To test the billing portal (manage/cancel), click **Manage Subscription** on the Settings page

### Test Email Notifications

1. Add a student with a real `parent_email` address you can access
2. Go to **Dashboard → Attendance** → mark that student as **Absent**
3. Go to **Dashboard → Messages** → click **Dispatch now**
4. The outbox should show the message flip from `queued` → `sent`
5. Check the parent's email inbox for the absence alert

### Test WhatsApp Notifications

1. Add a student with `parent_phone` in international format (e.g. `+91XXXXXXXXXX`)
2. Mark them absent → go to **Messages** → click **Dispatch now**
3. Outbox should show `sent` status
4. Check the WhatsApp number for the message

### Test Broadcast

1. Go to **Dashboard → Messages** → scroll to the Broadcast form
2. Fill in Title, Message, choose channel (Email + WhatsApp / Email only / WhatsApp only)
3. Optionally filter by Branch or Batch
4. Click Send → messages are queued for all matching active students
5. Click **Dispatch now** to send immediately

### Test Cron Jobs manually

```bash
# 1. Queue fee reminders, test reminders, class reminders, and holiday notices
curl "http://localhost:3000/api/jobs/risk-alerts?secret=YOUR_CRON_SECRET"

# 2. Dispatch everything in the queue
curl "http://localhost:3000/api/jobs/notifications?secret=YOUR_CRON_SECRET"
```

You can also trigger both from the **Dashboard → Messages** page using the "Queue reminders" and "Dispatch now" buttons without needing curl.

---

## Step 8 — Deploy to Vercel (Production Checklist)

### Add all env vars to Vercel

1. Go to your project on **[vercel.com](https://vercel.com)**
2. **Settings → Environment Variables**
3. Add every variable from your `.env.local` with the **Production** environment selected
4. Change `APP_URL` to your actual domain, e.g. `https://yourapp.vercel.app`

### Switch Stripe to Live mode

When you're ready to accept real payments:

1. Stripe Dashboard → toggle off **Test mode**
2. Developers → API keys → copy the **Live** secret key → update `STRIPE_SECRET_KEY` in Vercel
3. Recreate the two prices (Starter Monthly / Yearly) in Live mode → update `STRIPE_PRICE_STARTER_MONTHLY` and `STRIPE_PRICE_STARTER_YEARLY`
4. Developers → Webhooks → Add endpoint (Live mode) pointing to `https://yourapp.vercel.app/api/stripe/webhook` → update `STRIPE_WEBHOOK_SECRET`

### Cron jobs on Vercel

Your `vercel.json` already configures two cron jobs:

| Job | Schedule | What it does |
|---|---|---|
| `/api/jobs/risk-alerts` | Daily at 7:00 AM UTC | Queues fee reminders, test reminders, class reminders, holiday notices |
| `/api/jobs/notifications` | Every 15 minutes | Dispatches queued notifications via email and WhatsApp |

> ⚠️ Vercel cron jobs require the **Pro plan**. On the free Hobby plan, trigger them manually using the buttons on the Messages page or the curl commands above.

---

## Quick Reference — All Environment Variables

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase → Settings → API |
| `APP_URL` | ✅ Yes | Your domain (or `http://localhost:3000` locally) |
| `STRIPE_SECRET_KEY` | Billing | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Billing | Stripe CLI (local) or Stripe → Webhooks (prod) |
| `STRIPE_PRICE_STARTER_MONTHLY` | Billing | Stripe → Products → price ID |
| `STRIPE_PRICE_STARTER_YEARLY` | Billing | Stripe → Products → price ID |
| `RESEND_API_KEY` | Email | resend.com → API Keys |
| `EMAIL_FROM_ADDRESS` | Email | Your verified sender address |
| `WHATSAPP_WEBHOOK_URL` | WhatsApp | Your provider (WATI, Twilio, etc.) |
| `WHATSAPP_WEBHOOK_TOKEN` | WhatsApp | Your provider Bearer token |
| `CRON_SECRET` | Cron jobs | `openssl rand -hex 32` |
