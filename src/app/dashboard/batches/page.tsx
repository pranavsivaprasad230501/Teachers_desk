import { createBatchAction } from "@/app/actions";
import { AccessDenied } from "@/components/dashboard/access-denied";
import { SubscriptionGate } from "@/components/dashboard/subscription-gate";
import { CreateCentreForm } from "@/components/dashboard/create-centre-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth";
import { getAppContextForUser, getBatchesForContext, hasPaidAccess } from "@/lib/data";

export default async function BatchesPage() {
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

  const batches = await getBatchesForContext(appContext);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Batches</h2>
          <p className="mt-1 text-muted-foreground">
            Schedule your teaching groups and keep students organized by batch.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <CardTitle>{batch.name}</CardTitle>
                <CardDescription>
                  {batch.subject} · {batch.grade}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {batch.schedule}
              </CardContent>
            </Card>
          ))}
          {batches.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No batches yet. Create your first batch to allocate students and mark attendance.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {appContext.role === "teacher" ? (
        <AccessDenied
          title="Read-only batch view"
          description="Teachers can see their assigned batches here. Owners and admins create or edit batches."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create batch</CardTitle>
            <CardDescription>Add the subject, grade, and schedule used by this centre.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBatchAction} className="grid gap-4">
              <Field label="Batch name" id="name" placeholder="Morning Maths" />
              <Field label="Subject" id="subject" placeholder="Mathematics" />
              <Field label="Grade" id="grade" placeholder="Class 10" />
              <Field label="Schedule" id="schedule" placeholder="Mon-Fri · 6:00 AM to 7:00 AM" />
              <SubmitButton type="submit" pendingLabel="Creating...">
                Create Batch
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  placeholder,
}: {
  label: string;
  id: string;
  placeholder: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} required />
    </div>
  );
}
