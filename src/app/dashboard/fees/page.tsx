import { markFeePaidAction, seedCurrentMonthFeesAction } from "@/app/actions";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getFeesForMonth, getMonthKey, hasPaidAccess } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

type FeesPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const user = await requireUser();
  const appContext = await getAppContextForUser({ userId: user.id, phone: user.phone ?? null });
  const centre = appContext.centre;

  if (!centre) {
    return <CreateCentreForm />;
  }
  if (appContext.role === "teacher") {
    return <AccessDenied description="Teachers do not have access to fee collection, reminder, or overdue information." />;
  }

  const paidAccess = await hasPaidAccess(centre.id);
  if (!paidAccess) {
    return <SubscriptionGate trialEndsAt={appContext.subscription?.trial_ends_at} />;
  }

  const params = await searchParams;
  const month = params.month ?? getMonthKey();
  const fees = await getFeesForMonth(centre.id, month);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fees</h2>
          <p className="mt-1 text-muted-foreground">
            Monthly collection, paid timestamps, and overdue segmentation.
          </p>
        </div>
        <form action={seedCurrentMonthFeesAction}>
          <SubmitButton type="submit" variant="outline" pendingLabel="Syncing...">
            Sync Current Month Fees
          </SubmitButton>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Month</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-3">
            <Input type="month" name="month" defaultValue={month} className="max-w-56" />
            <SubmitButton type="submit" pendingLabel="Loading...">
              Load
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee ledger</CardTitle>
          <CardDescription>{fees.length} fee records for {month}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fees.map((fee) => (
            <div key={fee.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{fee.students?.name ?? "Unknown student"}</p>
                  <p className="text-sm text-muted-foreground">
                    {fee.students?.branches?.name ?? "No branch"} · {fee.students?.batches?.name ?? "Unassigned"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(Number(fee.amount_due ?? 0))}</p>
                  <p className="text-sm capitalize text-muted-foreground">{fee.status}</p>
                </div>
              </div>
              {fee.status !== "paid" ? (
                <form action={markFeePaidAction} className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <input type="hidden" name="fee_id" value={fee.id} />
                  <Input
                    name="amount_paid"
                    type="number"
                    defaultValue={String(Number(fee.amount_due ?? 0))}
                    className="max-w-48"
                  />
                  <SubmitButton type="submit" pendingLabel="Updating...">
                    Mark Paid
                  </SubmitButton>
                </form>
              ) : (
                <p className="mt-4 text-sm text-emerald-700">
                  Paid: {formatCurrency(Number(fee.amount_paid ?? 0))}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
