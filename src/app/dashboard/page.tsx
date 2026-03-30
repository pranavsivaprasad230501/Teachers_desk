import { redirect } from "next/navigation";
import Link from "next/link";

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
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="mt-1 text-muted-foreground">
          {centre.name} · Trial ends {formatDate(appContext.subscription?.trial_ends_at)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={String(stats.totalStudents)} />
        <StatCard label="Active Batches" value={String(stats.totalBatches)} />
        <StatCard label="Collected" value={formatCurrency(stats.collectedAmount)} />
        <StatCard label="Pending" value={formatCurrency(stats.pendingAmount)} />
        <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} />
        <StatCard label="Unpaid Fees" value={String(stats.overdueFees)} />
        <StatCard label="Open Alerts" value={String(stats.openAlerts)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Centre Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="font-medium text-slate-900">Current Branch</p>
              <p className="text-muted-foreground">{appContext.branch?.name ?? "Not assigned"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium text-slate-900">Role</p>
              <p className="text-muted-foreground capitalize">{appContext.role}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium text-slate-900">Subscription</p>
              <p className="text-muted-foreground capitalize">{appContext.subscription?.status ?? "setup required"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link className="rounded-lg border p-3 text-sm font-medium hover:bg-muted/40" href="/dashboard/attendance">
              Mark attendance
            </Link>
            <Link className="rounded-lg border p-3 text-sm font-medium hover:bg-muted/40" href="/dashboard/timetable">
              Open timetable
            </Link>
            <Link className="rounded-lg border p-3 text-sm font-medium hover:bg-muted/40" href="/dashboard/tests">
              Enter marks
            </Link>
            {appContext.role !== "teacher" ? (
              <>
                <Link className="rounded-lg border p-3 text-sm font-medium hover:bg-muted/40" href="/dashboard/fees">
                  Record fee payment
                </Link>
                <Link className="rounded-lg border p-3 text-sm font-medium hover:bg-muted/40" href="/dashboard/messages">
                  Send broadcast
                </Link>
                <Link className="rounded-lg border p-3 text-sm font-medium hover:bg-muted/40" href="/dashboard/branches">
                  Manage branches
                </Link>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/70 bg-white/85 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
