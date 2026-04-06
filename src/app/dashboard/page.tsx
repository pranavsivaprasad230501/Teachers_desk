import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SectionHero } from "@/components/dashboard/section-hero";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getDashboardStats, hasPaidAccess } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const authError = resolvedSearchParams.error;

  if (typeof authError === "string") {
    redirect(`/login?error=${encodeURIComponent(authError || "auth_failed")}`);
  }

  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  const centre = appContext.centre;

  if (!centre) {
    return <CreateCentreForm />;
  }

  const paidAccess = await hasPaidAccess(centre.id);
  if (!paidAccess) {
    return <SubscriptionGate trialEndsAt={appContext.subscription?.trial_ends_at} />;
  }

  const stats = await getDashboardStats(appContext);

  return (
    <div className="space-y-6">
      <SectionHero
        eyebrow="Centre Overview"
        title="Keep the whole centre in view from one polished workspace."
        description="Track learners, collections, batches, and risk signals at a glance, with a more visual dashboard that feels welcoming the moment you log in."
        imageSrc="/dashboard-overview.svg"
        imageAlt="Illustrated overview dashboard with cards for performance, students, and collection activity"
      />

      <div>
        <h2 className="text-3xl font-bold tracking-tight">{centre.name}</h2>
        <p className="mt-1 text-muted-foreground">
          Trial ends {formatDate(appContext.subscription?.trial_ends_at)} · {appContext.role}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={String(stats.totalStudents)} icon={Users} iconBg="bg-sky-100" iconColor="text-sky-600" />
        <StatCard label="Active Batches" value={String(stats.totalBatches)} icon={BookOpen} iconBg="bg-violet-100" iconColor="text-violet-600" />
        <StatCard label="Collected" value={formatCurrency(stats.collectedAmount)} icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard label="Pending" value={formatCurrency(stats.pendingAmount)} icon={CreditCard} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} icon={CalendarCheck} iconBg="bg-teal-100" iconColor="text-teal-600" />
        <StatCard label="Unpaid Fees" value={String(stats.overdueFees)} icon={AlertTriangle} iconBg="bg-rose-100" iconColor="text-rose-600" />
        <StatCard label="Open Alerts" value={String(stats.openAlerts)} icon={Bell} iconBg="bg-orange-100" iconColor="text-orange-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Centre Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <SnapshotRow label="Current Branch" value={appContext.branch?.name ?? "Not assigned"} />
            <SnapshotRow label="Role" value={appContext.role ?? "unknown"} capitalize />
            <SnapshotRow label="Subscription" value={appContext.subscription?.status ?? "setup required"} capitalize />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QuickAction href="/dashboard/attendance" icon={CalendarCheck} label="Mark attendance" />
            <QuickAction href="/dashboard/timetable" icon={Calendar} label="Open timetable" />
            <QuickAction href="/dashboard/tests" icon={GraduationCap} label="Enter marks" />
            {appContext.role !== "teacher" ? (
              <>
                <QuickAction href="/dashboard/fees" icon={CreditCard} label="Record fee payment" />
                <QuickAction href="/dashboard/messages" icon={Bell} label="Send broadcast" />
                <QuickAction href="/dashboard/branches" icon={Building2} label="Manage branches" />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="relative overflow-hidden border-white/70 bg-white/85 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}

function SnapshotRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <p className="font-medium text-slate-900">{label}</p>
      <p className={`text-muted-foreground ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      className="flex items-center justify-between rounded-lg border bg-white/60 p-3 text-sm font-medium transition hover:border-slate-300 hover:bg-muted/40"
      href={href}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-slate-500" />
        {label}
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </Link>
  );
}
