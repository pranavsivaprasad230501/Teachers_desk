import Link from "next/link";
import { ArrowRight, CreditCard, Lock } from "lucide-react";

import { formatDate } from "@/lib/format";

type SubscriptionGateProps = {
  trialEndsAt?: string | null;
};

function getDaysRemaining(trialEndsAt?: string | null) {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SubscriptionGate({ trialEndsAt }: SubscriptionGateProps) {
  const daysRemaining = getDaysRemaining(trialEndsAt);
  const isExpired = daysRemaining === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-8 shadow-[0_18px_40px_rgba(244,63,94,0.08)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
          {isExpired ? "Your trial has ended" : "Trial expires soon"}
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {isExpired
            ? "Your 14-day free trial has ended. Subscribe to continue using attendance, fees, student management, and the parent portal."
            : `You have ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left in your trial. Subscribe before ${formatDate(trialEndsAt)} to avoid any disruption.`}
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-rose-100 bg-white/70 p-4 text-sm sm:grid-cols-2">
          {[
            "Student & fee management",
            "Attendance tracking",
            "Parent WhatsApp & email alerts",
            "Test & marks management",
            "Timetable & batch scheduling",
            "Multi-branch operations",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-slate-700">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              {feature}
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f47c20] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(244,124,32,0.28)] transition hover:bg-[#e56b0c]"
          >
            <CreditCard className="h-4 w-4" />
            Subscribe now — Rs 1,499/month
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            View plans &amp; billing
          </Link>
        </div>
      </div>
    </div>
  );
}
